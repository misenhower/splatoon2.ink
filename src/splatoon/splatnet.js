require('dotenv').config();
require('console-stamp')(console);
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

const updateSchedules = function() {
    console.info('Updating map schedules...');

    api.get('schedules').then(response => {
        // Make sure the data path exists
        mkdirp(dataPath);

        fs.writeFile(`${dataPath}/schedules.json`, JSON.stringify(response.data));
        console.info('Updated map schedules.');
    });
}

const updateTimeline = function() {
    console.info('Updating timeline...');

    api.get('timeline').then(response => {
        // Make sure the data path exists
        mkdirp(dataPath);

        // Filter out everything but the data we need
        let data = { coop: null };
        if (response.data.coop && response.data.coop.importance > -1)
            data.coop = response.data.coop;

        fs.writeFile(`${dataPath}/timeline.json`, JSON.stringify(data));
        console.info('Updated timeline.');
    });
}

const updateFestivals = function() {
    console.info('Updating festivals...');

    api.get('festivals/active').then(response => {
        // Make sure the data path exists
        mkdirp(dataPath);

        fs.writeFile(`${dataPath}/festivals-na.json`, JSON.stringify(response.data));
        console.info('Updated festivals.');
    });
}

module.exports.update = function() {
    updateSchedules();
    updateTimeline();
    updateFestivals();
}
