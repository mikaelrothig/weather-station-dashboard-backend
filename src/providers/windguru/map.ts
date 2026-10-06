import type { Forecast, ModelRun, SpotInfo, WaveForecast } from '../types';

/*
 * Windguru's forecast format: a run start time plus parallel arrays indexed by hour offset.
 * `fcst` holds the land grid point and `fcst_sea` the sea one, which is what a kite spot wants for wind.
 */

const HOUR_MS = 60 * 60 * 1000;

type Raw = Record<string, any>;

// "YYYY-MM-DD HH:MM:SS" in UTC
const parseUtc = (value: unknown): string | null => {
    const match = typeof value === 'string' && value.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
    return match ? new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`).toISOString() : null;
};

const runStart = (fcst: Raw): Date => {
    if (typeof fcst.initstamp === 'number') return new Date(fcst.initstamp * 1000);
    // Older responses only carry init_d "dd.mm.yyyy" and init_h "06"
    const [day, month, year] = String(fcst.init_d).split('.').map(Number);
    return new Date(Date.UTC(year, month - 1, day, Number(fcst.init_h)));
};

const toModelRun = (fcst: Raw): ModelRun => ({
    name: fcst.model_name,
    runAt: runStart(fcst).toISOString(),
    updatedAt: parseUtc(fcst.update_last),
    nextUpdateAt: parseUtc(fcst.update_next),
});

const timesOf = (fcst: Raw): string[] => {
    const start = runStart(fcst).getTime();
    return (fcst.hours as number[]).map((offset) => new Date(start + offset * HOUR_MS).toISOString());
};

const valueAt = (values: unknown, i: number): number | null => {
    const value = Array.isArray(values) ? values[i] : null;
    return typeof value === 'number' ? value : null;
};

export const toForecast = (data: Raw): Forecast => {
    const { fcst } = data;
    const wind = data.fcst_sea?.WINDSPD ? data.fcst_sea : fcst;

    return {
        model: toModelRun(fcst),
        location: { lat: data.lat, lon: data.lon },
        sunrise: data.sunrise,
        sunset: data.sunset,
        hours: timesOf(fcst).map((time, i) => ({
            time,
            speed: wind.WINDSPD[i],
            gust: wind.GUST[i],
            direction: wind.WINDDIR[i],
            temperature: valueAt(fcst.TMP, i),
        })),
    };
};

/** null when the grid point has no wave data */
export const toWaveForecast = (data: Raw): WaveForecast | null => {
    const { fcst } = data;
    if (!fcst?.hours) return null;

    return {
        model: toModelRun(fcst),
        hours: timesOf(fcst).map((time, i) => ({
            time,
            height: valueAt(fcst.HTSGW, i),
            period: valueAt(fcst.PERPW, i),
            direction: valueAt(fcst.DIRPW, i),
        })),
    };
};

export const toSpotInfo = (data: Raw): SpotInfo => ({
    tz: data.tz,
    sst: data.sst ?? null,
    sunrise: data.sunrise,
    sunset: data.sunset,
    tide: data.tide ?? null,
    tide_datums: data.tide_datums ?? null,
});
