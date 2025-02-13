import axios, { AxiosResponse } from 'axios';

class WindguruApi {
    private static readonly BASE_URL = 'https://www.windguru.net/int/iapi.php';

    public static async fetchData(params: Record<string, string | number>): Promise<any> {
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