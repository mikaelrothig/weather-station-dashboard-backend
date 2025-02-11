import getWindguruData from './WRF9KM'; // Import your data fetching function
import { serve } from 'micro';
import * as http from 'http';

const handler = async (req, res) => {
    try {
        const data = await getWindguruData();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
    } catch (error) {
        console.error('Error fetching data:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to fetch data' }));
    }
};

serve(handler).listen(3000); // Start the server on port 3000