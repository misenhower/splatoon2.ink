require('dotenv').config();
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

const dataPath = path.resolve('public/data');

// SplatNet2 API
const api = axios.create({
    baseURL: 'https://app.splatoon2.nintendo.net/api/',
    headers: {'Cookie': `iksm_session=${process.env.NINTENDO_SESSION_ID}`},
});

module.exports.update = function() {
    // Make sure the data path exists
    mkdirp(dataPath);

    // Update map schedules
    console.info('Updating map schedules...');
    api.get('schedules').then(response => {
        fs.writeFile(`${dataPath}/schedules.json`, JSON.stringify(response.data));
        console.info('Updated map schedules.');
    });
}
