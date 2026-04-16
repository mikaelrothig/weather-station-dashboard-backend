interface MacwindParams {
    frequency: number;
}

class MacwindApi {
    private static readonly BASE_URL = 'https://mac-wind.appspot.com/data/';

    public static async fetchData(params: MacwindParams, retries = 4): Promise<any> {
        const url = `${this.BASE_URL}${params.frequency}min.json`;

        for (let attempt = 1; attempt <= retries + 1; attempt++) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 10000);

            try {
                const response = await fetch(url, { signal: controller.signal });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (typeof data !== 'object') {
                    throw new Error('Unexpected response format from Macwind');
                }

                return data;
            } catch (error: any) {
                console.warn(`Macwind fetch attempt ${attempt} failed: ${error.message}`);

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

export default MacwindApi;
