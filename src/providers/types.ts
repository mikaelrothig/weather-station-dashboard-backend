import type { Spot } from '../config/spots';

/*
 * The API's response format and the contracts every data provider implements. Routes only talk to these,
 * so a provider can be replaced by writing a new adapter and selecting it in providers/index.ts.
 * Units: knots, degrees the wind or swell comes from, °C, metres, seconds. Times are ISO 8601.
 */

/** hires: the high-resolution regional model · global: the long-range model */
export type ForecastKind = 'hires' | 'global';

export interface ModelRun {
    /** Short model name for display, e.g. "WRF 9 km" */
    name: string;
    /** When the run started */
    runAt: string;
    /** When the provider published this run, and when it expects the next; null if it doesn't say */
    updatedAt: string | null;
    nextUpdateAt: string | null;
}

export interface ForecastHour {
    time: string;
    speed: number;
    gust: number;
    direction: number;
    temperature: number | null;
}

export interface Forecast {
    model: ModelRun;
    /** The model grid point the forecast is for */
    location: { lat: number; lon: number };
    /** Spot-local clock times, "HH:MM" */
    sunrise: string;
    sunset: string;
    /** In time order. Steps can widen further out, e.g. 3-hourly beyond five days */
    hours: ForecastHour[];
}

export interface WaveHour {
    time: string;
    height: number | null;
    period: number | null;
    direction: number | null;
}

export interface WaveForecast {
    model: ModelRun;
    hours: WaveHour[];
}

/** Spot data that doesn't depend on a model run */
export interface SpotInfo {
    tz: string;
    /** Sea surface temperature in °C */
    sst: number | null;
    /** Spot-local clock times, "HH:MM" */
    sunrise: string;
    sunset: string;
    /** Harmonic constituents: name -> [amplitude (cm), phase (deg, UTC)] */
    tide: Record<string, [number, number]> | null;
    /** Datums in cm: mean sea level, lowest astronomical tide, mean high and low water */
    tide_datums: { msl: number; lat: number; mhw: number; mlw: number } | null;
}

export interface ForecastProvider {
    getForecast(spot: Spot, kind: ForecastKind): Promise<Forecast>;
    /** null where the provider has no swell for the spot, e.g. on a lake */
    getWaves(spot: Spot): Promise<WaveForecast | null>;
    getSpotInfo(spot: Spot): Promise<SpotInfo>;
}

export const LIVE_INTERVALS = ['1min', '15min'] as const;
export type LiveInterval = typeof LIVE_INTERVALS[number];

export const isLiveInterval = (value: string): value is LiveInterval => (LIVE_INTERVALS as readonly string[]).includes(value);

/** One station reading, averaged over the interval */
export interface LiveReading {
    time: string;
    /** Average, strongest and lightest wind over the interval */
    speed: number;
    gust: number;
    lull: number;
    /** null when the station can't name a direction, which happens in calm conditions */
    direction: number | null;
}

export interface LiveWindProvider {
    /** Recent readings, newest first */
    getReadings(interval: LiveInterval): Promise<LiveReading[]>;
}

/** One spot's wind for the home page: hourly from the start of today to the end of tomorrow, spot time */
export interface SpotSummary {
    /** The spot's URL name, e.g. "mistycliffs" */
    spot: string;
    /** Name of the high-resolution model the hours come from */
    model: string;
    /** Spot-local clock times, "HH:MM" */
    sunrise: string;
    sunset: string;
    hours: ForecastHour[];
}

/** A spot whose forecast couldn't be loaded; the rest of the summary still comes back */
export interface SpotSummaryError {
    spot: string;
    error: string;
}

/** GET /summary: every spot at once, so the home page needs one small request instead of one forecast per spot */
export interface Summary {
    spots: (SpotSummary | SpotSummaryError)[];
}
