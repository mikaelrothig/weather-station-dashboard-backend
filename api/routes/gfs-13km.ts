import { Router, Request, Response } from "express";
import WindguruApi from "../sources/windguru-api";
import { generateGFSRundef } from "../utils/rundef-generator";
import { LOCATION_CONFIG } from "../config/locations";

const router = Router();

router.get('/:location', async (req: Request, res: Response): Promise<void> => {
    try {
        const { location } = req.params;
        const config = LOCATION_CONFIG[location.toLowerCase()];

        if (!config) {
            res.status(400).json({ error: 'Invalid location specified' });
            return;
        }

        const params = {
            q: req.query.q as string || 'forecast',
            id_model: Number(req.query.id_model) || 3,
            rundef: req.query.rundef as string || generateGFSRundef(),
            id_spot: config.id_spot,
            WGCACHEABLE: Number(req.query.WGCACHEABLE) || 21600,
            cachefix: config.cachefix,
        };

        console.log(`Fetching Windguru GFS13km data for ${location} with params:`, params, `\n`);

        const data = await WindguruApi.fetchData(params);
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch Windguru data' });
    }
});

export default router;