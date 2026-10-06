import { Router } from 'express';
import { HttpError } from '../lib/http';
import { liveWindProvider } from '../providers';
import { isLiveInterval } from '../providers/types';

/** GET /1min or /15min, recent readings from the weather station */
export const liveWindRoute = Router().get('/:interval', async (req, res) => {
    const { interval } = req.params;

    if (!isLiveInterval(interval)) {
        throw new HttpError(404, `Unknown interval: ${interval}`);
    }

    res.json(await liveWindProvider.getReadings(interval));
});
