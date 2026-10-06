import { macwind } from './macwind';
import type { ForecastProvider, LiveWindProvider } from './types';
import { windguru } from './windguru';

// The one place that picks the data sources. To switch, implement the interface in a new adapter and change it here.
export const forecastProvider: ForecastProvider = windguru;
export const liveWindProvider: LiveWindProvider = macwind;
