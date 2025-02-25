import { Router, Request, Response } from "express";
import MacwindAPI from "../sources/MacwindAPI";

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const params = {
            frequency: Number(req.query.frequency) || 15,
        };

        console.log(`Fetching Macwind 15min data with params:`, params, `\n`);

        const data = await MacwindAPI.fetchData(params);
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch Macwind data' });
    }
});

export default router;