import axios from 'axios';

interface WindguruData {
    datetime: string;
    wind_avg: number;
    wind_max: number;
    wind_direction: number;
    temperature: number;
}

const windguruApiUrl = 'https://www.windguru.net/int/iapi.php';

const getWindguruData = async (): Promise<WindguruData[]> => {
    try {
        const params = {
            q: 'forecast',
            id_model: 36,
            rundef: '2025021106x0x78x0x78',
            id_spot: 208276,
            WGCACHEABLE: 21600,
            cachefix: '-33.82x18.47x0',
        };

        const response = await axios.get<WindguruData[]>(windguruApiUrl, { params });

        return response.data;
    } catch (error) {
        console.error('Error fetching Windguru data:', error);
        throw error;
    }
};

export default getWindguruData;