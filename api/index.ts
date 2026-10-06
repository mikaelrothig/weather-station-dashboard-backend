import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { cacheFor } from './middleware/cache';
import { errorHandler, notFound } from './middleware/errors';
import { forecastRoute } from './routes/forecast';
import { liveWindRoute } from './routes/live-wind';
import { spotRoute } from './routes/spot';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.static('./public'));
app.use(cors());

// Forecasts are kept until their next model run is due (routes/forecast.ts); spot info changes about daily;
// live readings every minute. If a provider is down, the last good copy is served for up to a day (an hour for live).
const HOUR = 3600;
app.use('/forecast', cacheFor({ fresh: 600, staleWhileRevalidate: 1800, staleIfError: 24 * HOUR }), forecastRoute);
app.use('/spots', cacheFor({ fresh: 3 * HOUR, staleWhileRevalidate: 1800, staleIfError: 24 * HOUR }), spotRoute);
app.use('/live', cacheFor({ fresh: 60, staleWhileRevalidate: 180, staleIfError: HOUR }), liveWindRoute);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});