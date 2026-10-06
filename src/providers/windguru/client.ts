import { fetchJson, UpstreamError } from '../../lib/http';

const BASE_URL = 'https://www.windguru.net/int/iapi.php';
// The API rejects requests without a windguru.cz referer
const HEADERS = { Referer: 'https://www.windguru.cz/' };

/** Calls Windguru's internal API. `q` selects the endpoint: forecast, spot or forecast_spot */
export const windguruRequest = async (query: Record<string, string | number>, retries?: number) => {
    const url = new URL(BASE_URL);
    Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, String(value)));

    const data = await fetchJson(url.toString(), { label: 'Windguru', headers: HEADERS, retries });

    // e.g. a run that isn't published yet; retrying won't change the answer
    if (data.return === 'error') {
        throw new UpstreamError(`Windguru: ${data.message}`, false);
    }

    return data;
};
