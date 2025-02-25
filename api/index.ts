import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import WindguruApi from './WindguruApi';
import MacwindAPI from "./MacwindAPI";
import { generateGFSRundef } from "./RundefGenerator";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    const routes = [
        "/windguru/wrf-9km",
        "/windguru/gfs-13km",
        "/macwind/1min",
        "/macwind/15min"
    ];

    const routesList = routes.map(route => `<li><a href="${route}">${route}</a></li>`).join('');
    const htmlResponse = `
        <h1>Kite Beach Forecast Backend</h1>
        <p>Available routes:</p>
        <ul>${routesList}</ul>
    `;
    res.send(htmlResponse);
});

// app.get('/windguru/wrf-9km', async (req: Request, res: Response) => {
//     try {
//         const params = {
//             q: req.query.q as string || 'forecast',
//             id_model: Number(req.query.id_model) || 36,
//             rundef: req.query.rundef as string || generateRundef(-7)+'x0x78x0x78',
//             id_spot: Number(req.query.id_spot) || 208276,
//             WGCACHEABLE: Number(req.query.WGCACHEABLE) || 21600,
//             cachefix: req.query.cachefix as string || '-33.82x18.47x0',
//         };
//
//         const data = await WindguruApi.fetchData(params);
//         res.json(data);
//     } catch (error) {
//         console.error('Error fetching data:', error);
//         res.status(500).json({ error: 'Failed to fetch Windguru data' });
//     }
// });

app.get('/windguru/gfs-13km', async (req: Request, res: Response) => {
    try {
        const params = {
            q: req.query.q as string || 'forecast',
            id_model: Number(req.query.id_model) || 3,
            rundef: req.query.rundef as string || generateGFSRundef(),
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

app.get('/macwind/1min', async (req: Request, res: Response) => {
    try {
        const params = {
            frequency: Number(req.query.frequency) || 1,
        };

        const data = await MacwindAPI.fetchData(params);
        res.json(data);
    } catch (error) {
        console.error('Error fetching alternative data:', error);
        res.status(500).json({ error: 'Failed to fetch alternative Macwind data' });
    }
});

app.get('/macwind/15min', async (req: Request, res: Response) => {
    try {
        const params = {
            frequency: Number(req.query.frequency) || 15,
        };

        const data = await MacwindAPI.fetchData(params);
        res.json(data);
    } catch (error) {
        console.error('Error fetching alternative data:', error);
        res.status(500).json({ error: 'Failed to fetch alternative Macwind data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});