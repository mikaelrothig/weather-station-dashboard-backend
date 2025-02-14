import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import WindguruApi from './WindguruApi';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Based on GMT-7
const generateRundef = () => {
    const now = new Date();
    const gmtMinus7 = new Date(now.getTime() - 7 * 60 * 60 * 1000);
    const year = gmtMinus7.getFullYear();
    const month = String(gmtMinus7.getMonth() + 1).padStart(2, '0');
    const day = String(gmtMinus7.getDate()).padStart(2, '0');
    const hour = gmtMinus7.getHours();

    let hourSuffix;
    if ([8, 9, 10, 11, 12, 13].includes(hour)) {
        hourSuffix = "06";
    } else if ([14, 15, 16, 17, 18, 19].includes(hour)) {
        hourSuffix = "12";
    } else if ([20, 21, 22, 23, 0, 1].includes(hour)) {
        hourSuffix = "18";
    } else {
        hourSuffix = "00";
    }

    return `${year}${month}${day}${hourSuffix}`;
};

app.get('/api/windguru/wrf-9km', async (req: Request, res: Response) => {
    try {
        const params = {
            q: req.query.q as string || 'forecast',
            id_model: Number(req.query.id_model) || 36,
            rundef: req.query.rundef as string || generateRundef()+'x0x78x0x78',
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

app.get('/api/windguru/gfs-13km', async (req: Request, res: Response) => {
    try {
        const params = {
            q: req.query.q as string || 'forecast',
            id_model: Number(req.query.id_model) || 3,
            rundef: req.query.rundef as string || generateRundef()+'x0x240x0x240-'+generateRundef()+'x243x384x243x384',
            id_spot: Number(req.query.id_spot) || 208276,
            WGCACHEABLE: Number(req.query.WGCACHEABLE) || 21600,
            cachefix: req.query.cachefix as string || '-33.82x18.47x0',
        };

        const data = await WindguruApi.fetchData(params);
        res.json(data);
    } catch (error) {
        console.error('Error fetching alternative data:', error);
        res.status(500).json({ error: 'Failed to fetch alternative Windguru data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});