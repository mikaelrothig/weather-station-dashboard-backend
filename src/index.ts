import getWindguruData from './WRF9KM';

const fetchData = async () => {
    try {
        const windguruData = await getWindguruData();
        console.log(windguruData);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

fetchData();