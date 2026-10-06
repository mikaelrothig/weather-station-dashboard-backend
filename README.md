<div align="center">
  <img alt="Logo" src="https://raw.githubusercontent.com/MikaelRothig/weather-station-dashboard-frontend/main/public/favicon.svg" width="100" />
</div>
<h1 align="center">
    Weather Station Dashboard Backend
</h1>
<p align="center">
    Backend for a kitesurf forecast webapp that aggregates data from multiple sources.
</p>

## 🛠 Installation & Set Up
*To view the data from this backend, please follow the installation and setup in <a href="https://github.com/mikaelrothig/weather-station-dashboard-frontend">Weather Station Dashboard Frontend</a>.*

1. Install dependencies

   ```sh
   npm install
   ```

2. Start the local development server

   ```sh
   npm run dev
   ```

## 🔌 API

All responses use one provider-neutral format, defined in `src/providers/types.ts`: knots, degrees the wind or swell comes from, °C, metres, and ISO 8601 times.

| Route | Returns |
|---|---|
| `GET /forecast/:spot/hires` | The region's high-resolution model (WRF 9 km) |
| `GET /forecast/:spot/global` | The long-range model (GFS 13 km) |
| `GET /forecast/:spot/waves` | Swell (GFS-Wave); 404 for spots without it, like lakes |
| `GET /spots/:spot` | Sea temperature, daylight and tide harmonics |
| `GET /live/1min`, `GET /live/15min` | Station readings, newest first |

## 🧭 How it's organised

```
api/
└── index.ts              Express app: middleware and route mounting (the only Vercel function)
src/
├── config/spots.ts       Every spot: region, tides, and each provider's id for it
├── routes/               Thin HTTP handlers that only talk to the provider interfaces
├── providers/
│   ├── types.ts          The response format and the ForecastProvider / LiveWindProvider contracts
│   ├── index.ts          Picks which provider serves each kind of data
│   ├── windguru/         Forecasts, sea temperature, tides: model runs, schedules and mapping
│   └── macwind.ts        Live readings from the MAC Wind station
├── middleware/           CDN caching and error responses
└── lib/http.ts           Provider calls: timeouts, retries, shared concurrent calls, 30 s failure cooldown
```

Vercel turns every file under `api/` into its own serverless function, and the Hobby plan allows 12. Keep `api/` to the single entry point and put everything else in `src/`.

### Switching data providers

1. Add an adapter under `src/providers/` that implements `ForecastProvider` or `LiveWindProvider`, mapping the provider's data to the types in `types.ts`.
2. Add the spots' identifiers for it to `src/config/spots.ts`, next to the `windguru` block.
3. Select it in `src/providers/index.ts`.

Routes and the frontend don't change.
