import { Router } from 'express';
import { findSpot } from '../config/spots';
import { forecastProvider } from '../providers';

/** GET /:spot, spot data that doesn't depend on a model run: sea temperature, daylight and tide harmonics */
export const spotRoute = Router().get('/:spot', async (req, res) => {
    const spot = findSpot(req.params.spot);
    const info = await forecastProvider.getSpotInfo(spot);

    res.json(spot.tides ? info : { ...info, tide: null, tide_datums: null });
});
