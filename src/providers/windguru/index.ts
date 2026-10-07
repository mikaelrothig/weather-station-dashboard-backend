import type { Spot } from '../../config/spots';
import type { ForecastProvider } from '../types';
import { cached } from '../../lib/store';
import { windguruRequest } from './client';
import { toForecast, toSpotInfo, toWaveForecast } from './map';
import { latestRun, MODELS } from './runs';
import type { WindguruModel } from './types';

// Windguru may cache a forecast response for this many seconds
const RESPONSE_CACHE_SECONDS = 21600;

// A published run never changes; it's kept long enough to outlive the next run being late, then expires by itself
const RUN_TTL_SECONDS = 3 * 24 * 3600;
// Sea temperature, daylight and tide constants change about daily
const SPOT_INFO_TTL_SECONDS = 12 * 3600;

/**
 * The latest run of a model at a grid point, already converted. Each run is fetched from Windguru once and then read
 * from the shared store by every instance and CDN region, until the next run replaces it.
 */
const storedRun = async <T>(spot: Spot, model: WindguruModel, cachefix: string, convert: (data: any) => T): Promise<T> => {
    const rundef = await latestRun(model);
    return cached(`windguru:forecast:${model.id}:${spot.windguru.id}:${cachefix}:${rundef}`, RUN_TTL_SECONDS, async () =>
        convert(await windguruRequest({
            q: 'forecast',
            id_model: model.id,
            rundef,
            id_spot: spot.windguru.id,
            WGCACHEABLE: RESPONSE_CACHE_SECONDS,
            cachefix,
        })),
    );
};

export const windguru: ForecastProvider = {
    getForecast(spot, kind) {
        return storedRun(spot, kind === 'hires' ? MODELS.wrf : MODELS.gfs, spot.windguru.cachefix, toForecast);
    },

    async getWaves(spot) {
        const { waveCachefix } = spot.windguru;
        return waveCachefix ? storedRun(spot, MODELS.gfsWave, waveCachefix, toWaveForecast) : null;
    },

    getSpotInfo: (spot) =>
        cached(`windguru:spot:${spot.windguru.id}`, SPOT_INFO_TTL_SECONDS, async () =>
            toSpotInfo(await windguruRequest({ q: 'spot', id_spot: spot.windguru.id }))),
};
