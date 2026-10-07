import { allSpots } from '../../config/spots';
import { cached, replaceStored } from '../../lib/store';
import { windguruRequest } from './client';
import type { WindguruModel } from './types';

/*
 * A Windguru "rundef" names a model run: start date and hour (UTC), then the forecast hours it spans,
 * e.g. 2026100512x0x78x0x78 for the 12 UTC run covering 78 hours.
 */

const HOUR_MS = 60 * 60 * 1000;

const utcDate = (date: Date) =>
    `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`;

/**
 * WRF runs at 00, 06, 12 and 18 UTC and covers 78 hours. Windguru publishes each run some hours later,
 * so the newest run at `at` is the last one that started at least `publishDelayHours` before it.
 */
export const wrfRun = (publishDelayHours: number) => (at: Date): string => {
    const published = new Date(at.getTime() - publishDelayHours * HOUR_MS);
    const run = String(Math.floor(published.getUTCHours() / 6) * 6).padStart(2, '0');
    return `${utcDate(published)}${run}x0x78x0x78`;
};

// Windguru serves GFS in two parts, hours 0–240 and 243–384, which it publishes at different times.
// Indexed by the UTC hour. Until 05 UTC the newest runs are yesterday's 18 and 12 UTC ones, so they're dated yesterday.
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

export const gfsRun = (at: Date): string => {
    const hour = at.getUTCHours();
    const date = utcDate(hour < 5 ? new Date(at.getTime() - 24 * HOUR_MS) : at);
    const [hourly, extended] = GFS_RUNS[hour];
    return `${date}${hourly}-${date}${extended}`;
};

export const MODELS = {
    // Windguru publishes WRF about 7 hours after a run starts
    wrf: { id: 36, name: 'WRF 9 km Southern Africa', scheduledRun: wrfRun(7) },
    gfs: { id: 3, name: 'GFS 13 km', scheduledRun: gfsRun },
    gfsWave: { id: 83, name: 'GFS-Wave 13 km', scheduledRun: gfsRun },
} satisfies Record<string, WindguruModel>;

/*
 * Which run is newest? Windguru lists every model's published runs in one call, so one lookup answers all of them.
 *
 * Rather than asking every 10 minutes, ask only when the schedule says something new is about to land:
 * - The listing is stored under the runs the schedule expects 30 minutes from now. Until one of those changes, it's
 *   reused as is, and the first request after a change makes one fresh lookup.
 * - If that lookup doesn't have a model's expected run yet (it's late, or about to land), it's asked again every
 *   10 minutes until it does. So a new run shows up within 10 minutes of publishing, as before.
 * That's about 10 lookups a day plus a few while runs are due, instead of up to 144. The schedule only decides
 * when to ask; the run itself always comes from Windguru's answer.
 */

interface Listing {
    runs: { id_model: number; rundef: string }[];
    checkedAt: number;
}

// Start checking a little before a run is expected, so one that's early isn't missed for long
const CHECK_AHEAD_MS = 30 * 60_000;
const RECHECK_MS = 10 * 60_000;
// Long enough to span the gap between two schedule changes; a new expectation gets a new key anyway
const LISTING_TTL_SECONDS = 12 * 3600;

// Which runs are out depends on the model, not the spot, so the listing is always asked through the first spot
const REFERENCE_SPOT_ID = allSpots()[0].windguru.id;

const fetchListing = async (): Promise<Listing> => {
    const data = await windguruRequest({ q: 'forecast_spot', id_spot: REFERENCE_SPOT_ID }, 0);
    return { runs: data.tabs?.[0]?.id_model_arr ?? [], checkedAt: Date.now() };
};

const listedRun = (listing: Listing, model: WindguruModel) => listing.runs.find((r) => r.id_model === model.id)?.rundef;

/**
 * The newest run of `model` that Windguru has published. Rundefs are fixed-width, so comparing them as strings
 * orders them by date. Falls back to the model's schedule if Windguru can't be asked.
 */
export const latestRun = async (model: WindguruModel): Promise<string> => {
    const expectedAt = new Date(Date.now() + CHECK_AHEAD_MS);
    const expected = model.scheduledRun(expectedAt);
    const key = `windguru:runs:${Object.values(MODELS).map((m) => m.scheduledRun(expectedAt)).join('|')}`;

    try {
        let listing = await cached(key, LISTING_TTL_SECONDS, fetchListing);
        let run = listedRun(listing, model);

        // Due and not asked in the last 10 minutes: ask again, and store the answer for every instance
        if ((!run || run < expected) && Date.now() - listing.checkedAt >= RECHECK_MS) {
            listing = await fetchListing();
            await replaceStored(key, listing, LISTING_TTL_SECONDS);
            run = listedRun(listing, model) ?? run;
        }
        return run ?? model.scheduledRun(new Date());
    } catch (error) {
        console.warn(`Could not look up the latest ${model.name} run, using its schedule: ${(error as Error).message}`);
        return model.scheduledRun(new Date());
    }
};
