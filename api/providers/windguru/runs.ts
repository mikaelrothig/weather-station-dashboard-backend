import { windguruRequest } from './client';
import type { WindguruModel } from './types';

/*
 * A Windguru "rundef" names a model run: start date and hour (UTC), then the forecast hours it spans,
 * e.g. 2026100512x0x78x0x78 for the 12 UTC run covering 78 hours.
 */

const HOUR_MS = 60 * 60 * 1000;
const LOOKUP_CACHE_MS = 10 * 60 * 1000;

const utcDate = (date: Date) =>
    `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`;

/**
 * WRF runs at 00, 06, 12 and 18 UTC and covers 78 hours. Windguru publishes each run some hours later,
 * so the newest available run is the last one that started at least `publishDelayHours` ago.
 */
export const wrfRun = (publishDelayHours: number): string => {
    const published = new Date(Date.now() - publishDelayHours * HOUR_MS);
    const run = String(Math.floor(published.getUTCHours() / 6) * 6).padStart(2, '0');
    return `${utcDate(published)}${run}x0x78x0x78`;
};

// Windguru serves GFS in two parts, hours 0–240 and 243–384, which it publishes at different times.
// Indexed by the current UTC hour; before 07 UTC the runs are dated yesterday.
const GFS_RUNS: [string, string][] = [
    ['18x0x240x0x240','12x243x384x249x384'], //00
    ['18x0x240x0x240','12x243x384x249x384'], //01
    ['18x0x240x0x240','12x243x384x249x384'], //02
    ['18x0x240x0x240','12x243x384x249x384'], //03
    ['18x0x240x0x240','12x243x384x249x384'], //04
    ['00x0x240x0x240','00x243x384x243x384'], //05
    ['00x0x240x0x240','00x243x384x243x384'], //06
    ['00x0x240x0x240','00x243x384x243x384'], //07
    ['00x0x240x0x240','00x243x384x243x384'], //08
    ['00x0x240x0x240','00x243x384x243x384'], //09
    ['00x0x240x0x240','00x243x384x243x384'], //10
    ['06x0x240x0x240','00x243x384x249x384'], //11
    ['06x0x240x0x240','00x243x384x249x384'], //12
    ['06x0x240x0x240','00x243x384x249x384'], //13
    ['06x0x240x0x240','00x243x384x249x384'], //14
    ['06x0x240x0x240','00x243x384x249x384'], //15
    ['06x0x240x0x240','00x243x384x249x384'], //16
    ['12x0x240x0x240','00x243x384x255x384'], //17
    ['12x0x240x0x240','12x243x384x243x384'], //18
    ['12x0x240x0x240','12x243x384x243x384'], //19
    ['12x0x240x0x240','12x243x384x243x384'], //20
    ['12x0x240x0x240','12x243x384x243x384'], //21
    ['12x0x240x0x240','12x243x384x243x384'], //22
    ['18x0x240x0x240','12x243x384x249x384']  //23
];

export const gfsRun = (): string => {
    const now = new Date();
    const hour = now.getUTCHours();
    const date = utcDate(hour <= 6 ? new Date(now.getTime() - 24 * HOUR_MS) : now);
    const [hourly, extended] = GFS_RUNS[hour];
    return `${date}${hourly}-${date}${extended}`;
};

const lookups = new Map<number, { runs: { id_model: number; rundef: string }[]; fetchedAt: number }>();

/**
 * Windguru only serves runs it has published, so ask it which run is current instead of guessing from the clock.
 * When a run is late this keeps serving the previous one. Falls back to the model's schedule if the lookup fails.
 */
export const latestRun = async (spotId: number, model: WindguruModel): Promise<string> => {
    try {
        let lookup = lookups.get(spotId);

        if (!lookup || Date.now() - lookup.fetchedAt > LOOKUP_CACHE_MS) {
            const data = await windguruRequest({ q: 'forecast_spot', id_spot: spotId }, 1);
            lookup = { runs: data.tabs?.[0]?.id_model_arr ?? [], fetchedAt: Date.now() };
            lookups.set(spotId, lookup);
        }

        return lookup.runs.find((run) => run.id_model === model.id)?.rundef ?? model.scheduledRun();
    } catch (error) {
        console.warn(`Could not look up the latest ${model.name} run, using its schedule: ${(error as Error).message}`);
        return model.scheduledRun();
    }
};
