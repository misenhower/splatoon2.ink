require('dotenv').config();
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

// Make sure the data path exists
const dataPath = path.resolve('public/data');
mkdirp(dataPath);

// SplatNet2 API
const api = axios.create({
    baseURL: 'https://app.splatoon2.nintendo.net/api/',
    headers: {'Cookie': `iksm_session=${process.env.NINTENDO_SESSION_ID}`},
});

// Update map schedules
console.info('Updating map schedules...');
api.get('schedules').then(response => {
    fs.writeFile(`${dataPath}/schedules.json`, JSON.stringify(response.data));
    console.info('Updated map schedules.');
});
