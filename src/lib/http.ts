/** A failed call to a data provider. Client errors (blocked, rate limited, bad request) won't change on retry */
export class UpstreamError extends Error {
    /** `status`: the provider's HTTP status, when it answered with one */
    constructor(message: string, readonly retryable: boolean, readonly status?: number) {
        super(message);
        this.name = 'UpstreamError';
    }
}

/** A call skipped because the same URL failed moments ago; nothing was sent */
export class CoolingDownError extends UpstreamError {
    constructor(previous: unknown) {
        super(`Skipped, failed recently: ${(previous as Error)?.message ?? previous}`, false);
        this.name = 'CoolingDownError';
    }
}

/** An error the API answers with its own status code, e.g. an unknown spot */
export class HttpError extends Error {
    constructor(readonly status: number, message: string) {
        super(message);
        this.name = 'HttpError';
    }
}

interface FetchJsonOptions {
    /** Names the provider in logs */
    label: string;
    headers?: Record<string, string>;
    retries?: number;
    timeoutMs?: number;
    /** Runs before every attempt, retries included; throwing stops the call without making it (e.g. a budget) */
    beforeAttempt?: () => Promise<void>;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** GET a JSON object or array, retrying network and server errors with a growing pause */
const fetchWithRetries = async (url: string, { label, headers, retries = 4, timeoutMs = 10_000, beforeAttempt }: FetchJsonOptions): Promise<unknown> => {
    console.log(`${label} GET ${url}`);

    for (let attempt = 1; ; attempt++) {
        // Outside the try: a refusal here isn't a failed attempt and is never retried
        await beforeAttempt?.();
        try {
            const response = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) });

            if (!response.ok) {
                // Retrying a 4xx makes a block or rate limit worse
                throw new UpstreamError(`HTTP ${response.status}`, response.status >= 500, response.status);
            }

            const data: unknown = await response.json();

            if (typeof data !== 'object' || data === null) {
                throw new UpstreamError('Unexpected response format', true);
            }

            return data;
        } catch (error) {
            const retryable = !(error instanceof UpstreamError) || error.retryable;
            console.warn(`${label} fetch attempt ${attempt} failed: ${(error as Error).message}`);

            if (!retryable || attempt > retries) {
                throw error;
            }

            await sleep(1000 * attempt);
        }
    }
};

/*
 * Protects providers from our own traffic when they struggle. Vercel's CDN can't cache error responses,
 * so without this every visitor's request during an outage would reach the provider, with retries.
 * A URL that keeps failing waits longer each time: 30 s, 2 min, 5 min, then every 15 min until it works again.
 * Both maps live in the function instance's memory, which Vercel shares between concurrent requests.
 */
const FAILURE_COOLDOWNS_MS = [30_000, 2 * 60_000, 5 * 60_000, 15 * 60_000];
const inFlight = new Map<string, Promise<unknown>>();
const recentFailures = new Map<string, { error: unknown; until: number; count: number }>();

/**
 * GET JSON from a provider. Concurrent requests for the same URL share one call, and a URL that just
 * failed answers with that failure for 30 seconds instead of calling the provider again.
 */
export const fetchJson = <T = Record<string, any>>(url: string, options: FetchJsonOptions): Promise<T> => {
    const failure = recentFailures.get(url);

    if (failure && failure.until > Date.now()) {
        console.warn(`${options.label}: skipping a call that failed recently (paused until ${new Date(failure.until).toISOString()})`);
        return Promise.reject(new CoolingDownError(failure.error));
    }

    let request = inFlight.get(url);

    if (!request) {
        request = fetchWithRetries(url, options)
            .then(
                (data) => {
                    recentFailures.delete(url);
                    return data;
                },
                (error) => {
                    const count = (recentFailures.get(url)?.count ?? 0) + 1;
                    const cooldown = FAILURE_COOLDOWNS_MS[Math.min(count, FAILURE_COOLDOWNS_MS.length) - 1];
                    recentFailures.set(url, { error, until: Date.now() + cooldown, count });
                    throw error;
                },
            )
            .finally(() => inFlight.delete(url));
        inFlight.set(url, request);
    }

    // Callers share the parsed body, so they map it into new objects rather than changing it
    return request as Promise<T>;
};
