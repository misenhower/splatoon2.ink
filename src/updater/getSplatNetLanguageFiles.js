// This is a helper used to retrieve language files from SplatNet.
// These files aren't used directly, but are just downloaded for help with updating manual translation files.

require('./bootstrap');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const axios = require('axios');
const { writeFormattedJson } = require('./utilities');
const { languages } = require('../js/regions');
const SplatNet = require('./splatnet');

const outputPath = path.resolve('storage/lang');

mkdirp(outputPath);

(async () => {
    for (let { region, language } of languages) {
        let splatnet = new SplatNet(region, language);
        let client = splatnet.getClient();
        client.defaults.baseURL = 'https://app.splatoon2.nintendo.net';

        // Get the main SplatNet page
        let response = await client.get('/');
        // The first script tag on the page is the localization file
        let matches = response.data.match(/script src="(.*)"/);
        // Download the localization file
        response = await client.get(matches[1]);
        // Set up a fake "window" to store the translations and run the downloaded file
        let window = {};
        eval(response.data);
        // The localization data is now in window.LocalizedMessage
        // Store the data to a JSON file
        writeFormattedJson(`${outputPath}/${region}-${language}.json`, window.LocalizedMessage);
    }
})();
