import { Router } from 'express';
import { findSpot } from '../config/spots';
import { forecastProvider } from '../providers';

/** GET /:spot, spot data that doesn't depend on a model run: sea temperature, daylight and tide harmonics */
export const spotRoute = Router().get('/:spot', async (req, res) => {
    res.json(await forecastProvider.getSpotInfo(findSpot(req.params.spot)));
});
