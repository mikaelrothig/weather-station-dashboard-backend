import { CoolingDownError, fetchJson, HttpError, UpstreamError } from '../../lib/http';
import { takeFromDailyBudget } from '../../lib/store';

const BASE_URL = 'https://www.windguru.net/int/iapi.php';
// The API rejects requests without a windguru.cz referer
const HEADERS = { Referer: 'https://www.windguru.cz/' };

/*
 * Everything sent to Windguru goes through three limits, so a bad day there never turns into a flood of calls.
 *
 * 1. Circuit breaker (per function instance)
 *    - Blocked or rate limited (HTTP 403/429, or its "forbidden" answer): no calls at all for an hour.
 *    - Failing (5 failures in a row: timeouts, 5xx, error answers): no calls for 5 min; each further failure doubles
 *      the pause, up to 30 min. One success resets it.
 *    - When a pause ends, a single call checks whether Windguru is back; every other request fails straight away
 *      until it answers. So a pause ending never lets a burst through.
 * 2. Error answers per URL: a URL Windguru answers with an error (a run it can't serve yet, a wrong grid point) isn't
 *    asked again for 1, then 5, then 15 min.
 * 3. Daily budget (shared by every instance and region, in the store): at most WINDGURU_DAILY_BUDGET HTTP calls a day
 *    (default 500; a healthy day needs at most about 240), counted before every attempt, retries included.
 *
 * While any of these refuse, the CDN keeps serving its last good copy (stale-if-error).
 */
const BLOCKED_PAUSE_MS = 60 * 60_000;
const FAILURES_BEFORE_PAUSE = 5;
const FIRST_PAUSE_MS = 5 * 60_000;
const LONGEST_PAUSE_MS = 30 * 60_000;
const ERROR_ANSWER_COOLDOWNS_MS = [60_000, 5 * 60_000, 15 * 60_000];
const DEFAULT_DAILY_BUDGET = 500;

let tripped = false;
let pausedUntil = 0;
let probing = false;
let consecutiveFailures = 0;
let nextPauseMs = FIRST_PAUSE_MS;
const errorAnswers = new Map<string, { message: string; until: number; count: number }>();

const dailyBudget = () => Number(process.env.WINDGURU_DAILY_BUDGET) || DEFAULT_DAILY_BUDGET;

const pause = (ms: number, reason: string) => {
    tripped = true;
    pausedUntil = Date.now() + ms;
    console.warn(`Windguru: pausing all calls for ${ms / 60_000} min (${reason})`);
};

const recordFailure = (isProbe: boolean, reason: string) => {
    consecutiveFailures++;
    // A failed check after a pause, or the fifth failure in a row, pauses (again) for longer
    if (isProbe || consecutiveFailures >= FAILURES_BEFORE_PAUSE) {
        pause(nextPauseMs, isProbe ? `still failing: ${reason}` : `${consecutiveFailures} failures in a row`);
        nextPauseMs = Math.min(nextPauseMs * 2, LONGEST_PAUSE_MS);
    }
};

const recordSuccess = () => {
    tripped = false;
    consecutiveFailures = 0;
    nextPauseMs = FIRST_PAUSE_MS;
};

const isBlocked = (error: unknown) => error instanceof UpstreamError && (error.status === 403 || error.status === 429);

/** Calls Windguru's internal API. `q` selects the endpoint: forecast, spot or forecast_spot */
export const windguruRequest = async (query: Record<string, string | number>, retries = 1) => {
    if (Date.now() < pausedUntil) {
        throw new UpstreamError(`Windguru calls paused until ${new Date(pausedUntil).toISOString()}`, false);
    }
    // After a pause only one call goes out, to check whether Windguru is back
    const isProbe = tripped;
    if (isProbe && probing) throw new UpstreamError('Windguru calls paused while checking whether it is back', false);

    const url = new URL(BASE_URL);
    Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, String(value)));
    const previous = errorAnswers.get(url.toString());
    if (previous && previous.until > Date.now()) {
        throw new UpstreamError(`Windguru: ${previous.message} (not asking again until ${new Date(previous.until).toISOString()})`, false);
    }

    if (isProbe) probing = true;
    try {
        let data;
        try {
            data = await fetchJson(url.toString(), {
                label: 'Windguru',
                headers: HEADERS,
                retries,
                beforeAttempt: () => takeFromDailyBudget('windguru', dailyBudget()),
            });
        } catch (error) {
            // Refused before calling (budget used up, store unavailable, the URL failed moments ago): nothing was sent,
            // so it isn't a new Windguru failure
            if (error instanceof HttpError || error instanceof CoolingDownError) throw error;
            if (isBlocked(error)) pause(BLOCKED_PAUSE_MS, (error as Error).message);
            else recordFailure(isProbe, (error as Error).message);
            throw error;
        }

        if (data.return === 'error') {
            const message = String(data.message);
            // How Windguru answers a client it has blocked
            if (/forbidden/i.test(message)) pause(BLOCKED_PAUSE_MS, 'forbidden');
            else recordFailure(isProbe, message);
            // Asking the same URL again straight away won't change the answer
            const count = (previous?.count ?? 0) + 1;
            const cooldown = ERROR_ANSWER_COOLDOWNS_MS[Math.min(count, ERROR_ANSWER_COOLDOWNS_MS.length) - 1];
            errorAnswers.set(url.toString(), { message, until: Date.now() + cooldown, count });
            throw new UpstreamError(`Windguru: ${message}`, false);
        }

        recordSuccess();
        errorAnswers.delete(url.toString());
        return data;
    } finally {
        if (isProbe) probing = false;
    }
};
