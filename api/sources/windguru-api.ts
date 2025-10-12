import axios, { AxiosResponse } from 'axios';

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

    public static async fetchData(params: WindguruParams, retries = 2): Promise<any> {
        for (let attempt = 1; attempt <= retries + 1; attempt++) {
            try {
                const response: AxiosResponse = await axios.get(this.BASE_URL, {
                    params,
                    timeout: 10000, // 10s timeout
                });

                if (typeof response.data !== 'object') {
                    throw new Error('Unexpected response format from Windguru');
                }

                return response.data;
            } catch (error: any) {
                console.warn(`Windguru fetch attempt ${attempt} failed: ${error.message}`);

                if (attempt > retries) {
                    throw error;
                }

                await new Promise(res => setTimeout(res, 1000 * attempt));
            }
        }
    }
}

export default WindguruApi;