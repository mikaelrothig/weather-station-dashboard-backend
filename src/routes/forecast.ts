import { Response, Router } from 'express';
import { findSpot } from '../config/spots';
import { HttpError } from '../lib/http';
import { setFreshFor } from '../middleware/cache';
import { forecastProvider } from '../providers';
import type { ForecastKind, ModelRun } from '../providers/types';

const KINDS: readonly string[] = ['hires', 'global'] satisfies ForecastKind[];

const MINUTE = 60;
// Providers publish a few minutes either side of their own estimate
const PUBLISH_MARGIN = 5 * MINUTE;
// When the next run's time is unknown, overdue or close, check this often so it shows up soon after publishing
const CHECK_EVERY = 10 * MINUTE;
const LONGEST = 6 * 60 * MINUTE;

/**
 * A run doesn't change until the next one is published, so it can be cached until then. This keeps calls to the
 * provider to a few per spot per run (about 4 a day) instead of one every 10 minutes.
 */
export const secondsUntilNextRun = (model: ModelRun): number => {
    const secondsUntilDue = model.nextUpdateAt ? (Date.parse(model.nextUpdateAt) - Date.now()) / 1000 : NaN;
    const seconds = secondsUntilDue + PUBLISH_MARGIN;
    return Number.isFinite(seconds) && seconds > CHECK_EVERY ? Math.min(seconds, LONGEST) : CHECK_EVERY;
};

const cacheUntilNextRun = (res: Response, model: ModelRun) => setFreshFor(res, secondsUntilNextRun(model));

/** GET /:spot/hires, /:spot/global and /:spot/waves */
export const forecastRoute = Router()
    .get('/:spot/waves', async (req, res) => {
        const spot = findSpot(req.params.spot);
        const waves = await forecastProvider.getWaves(spot);

        if (!waves) {
            throw new HttpError(404, `No wave forecast for ${spot.slug}`);
        }

        cacheUntilNextRun(res, waves.model);
        res.json(waves);
    })
    .get('/:spot/:kind', async (req, res) => {
        const { kind } = req.params;

        if (!KINDS.includes(kind)) {
            throw new HttpError(404, `Unknown forecast: ${kind}`);
        }

        const spot = findSpot(req.params.spot);
        const forecast = await forecastProvider.getForecast(spot, kind as ForecastKind);

        cacheUntilNextRun(res, forecast.model);
        res.json(forecast);
    });
