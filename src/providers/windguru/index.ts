import type { Region, Spot } from '../../config/spots';
import type { ForecastProvider } from '../types';
import { windguruRequest } from './client';
import { toForecast, toSpotInfo, toWaveForecast } from './map';
import { gfsRun, latestRun, wrfRun } from './runs';
import type { WindguruModel } from './types';

const MODELS = {
    // Windguru publishes these about 7 hours (Southern Africa) and 7.5 hours (Europe) after a run starts
    wrfSouthAfrica: { id: 36, name: 'WRF 9 km Southern Africa', scheduledRun: () => wrfRun(7) },
    wrfEurope: { id: 21, name: 'WRF 9 km Europe', scheduledRun: () => wrfRun(8) },
    gfs: { id: 3, name: 'GFS 13 km', scheduledRun: gfsRun },
    gfsWave: { id: 83, name: 'GFS-Wave 13 km', scheduledRun: gfsRun },
} satisfies Record<string, WindguruModel>;

const HIRES_MODEL: Record<Region, WindguruModel> = {
    'south-africa': MODELS.wrfSouthAfrica,
    netherlands: MODELS.wrfEurope,
};

// Windguru may cache a forecast response for this many seconds
const RESPONSE_CACHE_SECONDS = 21600;

const fetchRun = async (spot: Spot, model: WindguruModel, cachefix: string) => windguruRequest({
    q: 'forecast',
    id_model: model.id,
    rundef: await latestRun(spot.windguru.id, model),
    id_spot: spot.windguru.id,
    WGCACHEABLE: RESPONSE_CACHE_SECONDS,
    cachefix,
});

export const windguru: ForecastProvider = {
    async getForecast(spot, kind) {
        const model = kind === 'hires' ? HIRES_MODEL[spot.region] : MODELS.gfs;
        return toForecast(await fetchRun(spot, model, spot.windguru.cachefix));
    },

    async getWaves(spot) {
        const { waveCachefix } = spot.windguru;
        return waveCachefix ? toWaveForecast(await fetchRun(spot, MODELS.gfsWave, waveCachefix)) : null;
    },

    getSpotInfo: async (spot) => toSpotInfo(await windguruRequest({ q: 'spot', id_spot: spot.windguru.id })),
};
