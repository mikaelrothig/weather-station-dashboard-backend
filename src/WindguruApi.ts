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

    public static async fetchData(params: WindguruParams): Promise<any> {
        try {
            const response: AxiosResponse = await axios.get(this.BASE_URL, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching Windguru data:', error);
            throw new Error('Failed to fetch Windguru data');
        }
    }
}

export default WindguruApi;
