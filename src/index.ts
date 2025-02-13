import WindguruApi from './WindguruApi';

const fetchData = async () => {
    try {
        const params = {
            q: 'forecast',
            id_model: 36,
            rundef: '2025021306x0x78x0x78',
            id_spot: 208276,
            WGCACHEABLE: 21600,
            cachefix: '-33.82x18.47x0',
        };

        WindguruApi.fetchData(params)
            .then(data => console.log(data))
            .catch(error => console.error(error));

    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

fetchData();