import { Redis } from '@upstash/redis';
import { HttpError } from './http';

/*
 * A shared Redis store (Upstash, connected to the Vercel project) that every function instance and CDN region reads,
 * so data fetched once from a provider is reused everywhere instead of fetched again.
 *
 * Deployed (on Vercel), the store is required: without it the API makes no provider calls at all and answers 503,
 * so a misconfigured deploy or a used-up free allowance can never turn into a flood of calls to Windguru. Visitors
 * keep the CDN's last good copy (stale-if-error, 24 h) meanwhile. Locally it's optional, so the dev server works
 * without one.
 */

// Vercel sets VERCEL=1 in deployed functions; REQUIRE_STORE overrides it either way
const storeRequired = () => (process.env.REQUIRE_STORE ?? (process.env.VERCEL ? 'true' : 'false')) === 'true';

// After a store error, don't touch it (or the provider) for a minute rather than retrying on every request
const STORE_RETRY_AFTER_MS = 60_000;
let storeDownUntil = 0;

let client: Redis | null | undefined;

// Read on first use rather than at import, so dotenv has loaded .env by then
const getClient = (): Redis | null => {
    if (client === undefined) {
        const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
        client = url && token ? new Redis({ url, token }) : null;
        if (!client) {
            console.error(storeRequired()
                ? 'Store unavailable: KV_REST_API_URL/TOKEN are missing, so no provider calls will be made'
                : 'Store: no KV_REST_API_URL/TOKEN, running without the shared store (local only)');
        }
    }
    return client;
};

const unavailable = (reason: string) => new HttpError(503, `Shared store unavailable (${reason}), not calling the provider`);

const markDown = (error: unknown) => {
    storeDownUntil = Date.now() + STORE_RETRY_AFTER_MS;
    console.error(`Store unavailable: ${(error as Error).message}`);
};

/**
 * Returns the stored value for `key`, or runs `load` and stores its result for `ttlSeconds`. Failures from `load`
 * aren't stored, so the next caller tries again. When the store is required but missing or failing, `load` never
 * runs and this throws a 503 instead.
 */
export const cached = async <T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> => {
    const required = storeRequired();
    const redis = getClient();

    if (!redis) {
        if (required) throw unavailable('not configured');
        return load();
    }

    if (Date.now() < storeDownUntil) {
        if (required) throw unavailable('recent errors');
        return load();
    }

    let hit: T | null;
    try {
        hit = (await redis.get<T>(key)) ?? null;
    } catch (error) {
        markDown(error);
        if (required) throw unavailable('read failed');
        return load();
    }
    if (hit !== null) return hit;

    const value = await load();
    try {
        await redis.set(key, value, { ex: Math.max(1, Math.round(ttlSeconds)) });
    } catch (error) {
        // This value is already fetched, so hand it back; the next calls stop until the store recovers
        markDown(error);
    }
    return value;
};

/** Replaces a stored value, e.g. one `cached` returned that turned out to be out of date. Best effort: a failure only logs */
export const replaceStored = async <T>(key: string, value: T, ttlSeconds: number): Promise<void> => {
    const redis = getClient();
    if (!redis || Date.now() < storeDownUntil) return;
    try {
        await redis.set(key, value, { ex: Math.max(1, Math.round(ttlSeconds)) });
    } catch (error) {
        markDown(error);
    }
};

/**
 * Counts one call against a limit shared by every instance and region for the day (UTC), and throws a 503 once
 * it's used up, so the call isn't made. Like everything else here, a required store that's missing or failing
 * refuses the call too. Without a store locally there's no budget.
 */
export const takeFromDailyBudget = async (name: string, limit: number): Promise<void> => {
    const required = storeRequired();
    const redis = getClient();

    if (!redis || Date.now() < storeDownUntil) {
        if (required) throw unavailable(redis ? 'recent errors' : 'not configured');
        return;
    }

    const key = `budget:${name}:${new Date().toISOString().slice(0, 10)}`;
    let used: number;
    try {
        used = await redis.incr(key);
        // Kept 30 days, so each day's count stays readable as a month of history, then cleans itself up
        if (used === 1) await redis.expire(key, 30 * 24 * 3600);
    } catch (error) {
        markDown(error);
        if (required) throw unavailable('budget check failed');
        return;
    }

    if (used > limit) {
        if (used === limit + 1) console.error(`Budget: ${name} used all ${limit} calls for today; no more until 00:00 UTC`);
        throw new HttpError(503, `Daily ${name} budget of ${limit} calls used up`);
    }
};
