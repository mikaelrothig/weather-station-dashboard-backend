import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import WindguruApi from './WindguruApi';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/windguru', async (req: Request, res: Response) => {
    try {
        const params = {
            q: req.query.q as string || 'forecast',
            id_model: Number(req.query.id_model) || 36,
            rundef: req.query.rundef as string || '2025021312x0x78x0x78',
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});