import axios, { AxiosResponse } from 'axios';

interface MacwindParams {
    frequency: number;
}

class MacwindApi {
    private static readonly BASE_URL = 'https://mac-wind.appspot.com/data/';

    public static async fetchData(params: MacwindParams): Promise<any> {
        try {
            const url = `${this.BASE_URL}${params.frequency}min.json`;
            const response: AxiosResponse = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('Error fetching Windguru data:', error);
            throw new Error('Failed to fetch Windguru data');
        }
    }
}

export default MacwindApi;