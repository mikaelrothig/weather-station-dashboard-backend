interface WindguruParams {
    q: string;
    id_model: number;
    rundef: string;
    id_spot: number;
    WGCACHEABLE: number;
    cachefix: string;
}

class WindguruApi {
    private static readonly BASE_URL = 'https://www.windguru.net/int/iapi.php';

    public static async fetchData(params: WindguruParams, retries = 4): Promise<any> {
        const url = new URL(this.BASE_URL);
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

        for (let attempt = 1; attempt <= retries + 1; attempt++) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 10000);

            try {
                const response = await fetch(url.toString(), { signal: controller.signal });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (typeof data !== 'object') {
                    throw new Error('Unexpected response format from Windguru');
                }

                return data;
            } catch (error: any) {
                console.warn(`Windguru fetch attempt ${attempt} failed: ${error.message}`);

                if (attempt > retries) {
                    throw error;
                }

                await new Promise(res => setTimeout(res, 1000 * attempt));
            } finally {
                clearTimeout(timer);
            }
        }
    }
}

export default WindguruApi;
