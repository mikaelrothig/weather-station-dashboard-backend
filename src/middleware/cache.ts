import { NextFunction, Request, Response } from 'express';

interface CachePolicy {
    /** Seconds a response stays fresh, unless the route sets its own with setFreshFor() */
    fresh: number;
    /** Seconds it's then served stale while one request refreshes it in the background */
    staleWhileRevalidate: number;
    /**
     * Seconds the last good copy keeps being served when a refresh fails, so an outage shows slightly old
     * data rather than an error (the data carries its own times, so the UI can say how old)
     */
    staleIfError: number;
}

/**
 * Lets Vercel's CDN share responses between visitors, so traffic doesn't multiply calls to the providers.
 * Errors themselves are never cached here: Vercel's CDN only caches 200, 404, 410 and redirects.
 * lib/http.ts remembers failures briefly instead.
 */
export const cacheFor = ({ fresh, staleWhileRevalidate, staleIfError }: CachePolicy) => (_req: Request, res: Response, next: NextFunction) => {
    const json = res.json.bind(res);
    res.json = (body) => {
        const seconds = res.locals.freshFor ?? fresh;
        res.set('Cache-Control', res.statusCode < 400
            ? `public, s-maxage=${seconds}, stale-while-revalidate=${staleWhileRevalidate}, stale-if-error=${staleIfError}`
            : 'no-store');
        return json(body);
    };
    next();
};

/** Overrides the policy's freshness for this response, e.g. to keep a forecast until its next run is due */
export const setFreshFor = (res: Response, seconds: number) => {
    res.locals.freshFor = Math.max(1, Math.round(seconds));
};
