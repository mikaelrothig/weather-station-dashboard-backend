import axios, { AxiosResponse } from 'axios';

interface MacwindParams {
    frequency: number;
}

class MacwindApi {
    private static readonly BASE_URL = 'https://mac-wind.appspot.com/data/';

    public static async fetchData(params: MacwindParams, retries = 2): Promise<any> {
        for (let attempt = 1; attempt <= retries + 1; attempt++) {
            try {
                const url = `${this.BASE_URL}${params.frequency}min.json`;
                const response: AxiosResponse = await axios.get(url, {
                    params,
                    timeout: 10000, // 10s timeout
                });

                if (typeof response.data !== 'object') {
                    throw new Error('Unexpected response format from Macwind');
                }

                return response.data;
            } catch (error: any) {
                console.warn(`Macwind fetch attempt ${attempt} failed: ${error.message}`);

                if (attempt > retries) {
                    throw error;
                }

                await new Promise(res => setTimeout(res, 1000 * attempt));
            }
        }
    }
}

export default MacwindApi;