import { fetchJson } from '../lib/http';
import type { LiveReading, LiveWindProvider } from './types';

/*
 * MAC Wind's weather station at Blouberg. Readings arrive newest first, with numbers as strings,
 * a 16-point compass label (empty in calm conditions; 1-minute readings add exact degrees),
 * and the station's local date and clock in South African time (UTC+2, no daylight saving).
 */

const BASE_URL = 'https://mac-wind.appspot.com/data';

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

interface RawReading {
    date: string;
    time: string;
    avg: string;
    high: string;
    low: string;
    dir: string;
    dirDegrees?: string;
}

const toDirection = (reading: RawReading): number | null => {
    if (reading.dirDegrees) return Number(reading.dirDegrees);
    const index = COMPASS.indexOf(reading.dir?.toUpperCase());
    return index === -1 ? null : index * 22.5;
};

const toReading = (reading: RawReading): LiveReading => ({
    time: new Date(`${reading.date}T${reading.time}:00+02:00`).toISOString(),
    speed: Number(reading.avg),
    gust: Number(reading.high),
    lull: Number(reading.low),
    direction: toDirection(reading),
});

export const macwind: LiveWindProvider = {
    async getReadings(interval) {
        const data = await fetchJson<RawReading[]>(`${BASE_URL}/${interval}.json`, { label: 'MAC Wind' });
        return Array.isArray(data) ? data.map(toReading) : [];
    },
};
