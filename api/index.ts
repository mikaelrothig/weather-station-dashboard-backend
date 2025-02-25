import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import home from './routes/home';
import wrf9kmRoute from './routes/wrf-9km';
import gfs13kmRoute from './routes/gfs-13km';
import mac1min from "./routes/mac-1min";
import mac15min from "./routes/mac-15min";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/', home);
app.use('/windguru/wrf-9km', wrf9kmRoute);
app.use('/windguru/gfs-13km', gfs13kmRoute);
app.use('/macwind/1min', mac1min);
app.use('/macwind/15min', mac15min);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});