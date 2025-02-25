import { Router, Request, Response } from 'express';
import WindguruApi from '../WindguruApi';
import { generateWRFRundef } from '../RundefGenerator';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const params = {
            q: req.query.q as string || 'forecast',
            id_model: Number(req.query.id_model) || 36,
            rundef: req.query.rundef as string || generateWRFRundef(),
            id_spot: Number(req.query.id_spot) || 208276,
            WGCACHEABLE: Number(req.query.WGCACHEABLE) || 21600,
            cachefix: req.query.cachefix as string || '-33.82x18.47x0',
        };

        const data = await WindguruApi.fetchData(params);
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch Windguru data' });
    }
});

export default router;