import { Router, Request, Response } from "express";
import WindguruApi from "../sources/windguru-api";
import { generateGFSRundef } from "../utils/rundef-generator";
import { SPOT_CONFIG } from "../config/spots";

const router = Router();

router.get('/:spot', async (req: Request, res: Response): Promise<void> => {
    try {
        const { spot } = req.params;
        const config = SPOT_CONFIG[spot.replace(/\s+/g, '').toLowerCase()];

        if (!config) {
            res.status(400).json({ error: 'Invalid spot specified' });
            return;
        } else if (!config.cachefixWave) {
            res.status(400).json({ error: 'Missing cachefixWave value' });
            return;
        }

        const params = {
            q: req.query.q as string || 'forecast',
            id_model: Number(req.query.id_model) || 83,
            rundef: req.query.rundef as string || generateGFSRundef(),
            id_spot: config.id_spot,
            WGCACHEABLE: Number(req.query.WGCACHEABLE) || 21600,
            cachefix: config.cachefixWave,
        };

        console.log(`Fetching Windguru GFSW13km data for ${spot} with params:`, params, `\n`);

        const data = await WindguruApi.fetchData(params);
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch Windguru data' });
    }
});

export default router;