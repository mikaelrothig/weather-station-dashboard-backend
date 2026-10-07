import { Router } from 'express';
import { allSpots, TIME_ZONE } from '../config/spots';
import { HttpError } from '../lib/http';
import { setFreshFor } from '../middleware/cache';
import { forecastProvider } from '../providers';
import type { Forecast, ModelRun, Summary } from '../providers/types';
import { secondsUntilNextRun } from './forecast';

// Fetches at most this many spots at once, so refreshing the summary never sends a burst to the provider
const CONCURRENCY = 4;
// With a spot missing, check back soon rather than waiting for the next model run
const RETRY_FAILED_AFTER = 10 * 60;

const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

/** "2026-10-07" in South African time */
const dayKey = (date: Date) => dayFormatter.format(date);

/** Keeps today and tomorrow (spot time): enough for "now", today's window and tomorrow's, without the rest of the week */
const todayAndTomorrow = (forecast: Forecast) => {
    const now = Date.now();
    const days = new Set([dayKey(new Date(now)), dayKey(new Date(now + 24 * 3600 * 1000))]);
    return forecast.hours.filter((hour) => days.has(dayKey(new Date(hour.time))));
};

const mapWithLimit = async <T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> => {
    const results: R[] = new Array(items.length);
    let next = 0;
    const worker = async () => {
        while (next < items.length) {
            const i = next++;
            results[i] = await fn(items[i]);
        }
    };
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return results;
};

/** GET /summary, every spot's wind for today and tomorrow, for the home page */
export const summaryRoute = Router().get('/', async (_req, res) => {
    const runs: ModelRun[] = [];

    const spots: Summary['spots'] = await mapWithLimit(allSpots(), CONCURRENCY, async (spot) => {
        try {
            // Through the provider, so each spot's run comes from the shared store and costs Windguru nothing extra
            const forecast = await forecastProvider.getForecast(spot, 'hires');
            runs.push(forecast.model);
            return {
                spot: spot.slug,
                model: forecast.model.name,
                sunrise: forecast.sunrise,
                sunset: forecast.sunset,
                hours: todayAndTomorrow(forecast),
            };
        } catch (error) {
            // One spot down shouldn't blank the whole home page; it shows that spot as unavailable instead
            console.warn(`Summary: no forecast for ${spot.slug}: ${(error as Error).message}`);
            return { spot: spot.slug, error: 'Forecast unavailable' };
        }
    });

    if (runs.length === 0) {
        // Not cached, so the CDN keeps serving the last good summary (stale-if-error) while this lasts
        throw new HttpError(502, 'No forecasts available');
    }

    // Fresh until the first spot's next run is due, the same rule the forecasts themselves use
    const fresh = Math.min(...runs.map(secondsUntilNextRun));
    setFreshFor(res, runs.length < spots.length ? Math.min(fresh, RETRY_FAILED_AFTER) : fresh);
    res.json({ spots } satisfies Summary);
});
