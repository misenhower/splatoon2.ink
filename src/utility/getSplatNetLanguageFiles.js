// This is a helper used to retrieve language files from SplatNet.
// These files aren't used directly, but are just downloaded for help with updating manual translation files.

import path from 'node:path';
import { mkdirpSync as mkdirp } from 'mkdirp';
import { writeFormattedJson } from '../common/utilities.js';
import { languages } from '../common/regions.js';
import SplatNet from '../common/splatnet.js';

const outputPath = path.resolve('storage/lang');

export default async function getSplatNetLanguageFiles() {
    mkdirp(outputPath);

    for (let { region, language } of languages) {
        let splatnet = new SplatNet(region, language);

        // Get the main SplatNet page
        let page = await splatnet.getText('/');
        // The first script tag on the page is the localization file
        let matches = page.match(/script src="(.*)"/);
        // Download the localization file
        let script = await splatnet.getText(matches[1]);
        // Set up a fake "window" to store the translations and run the downloaded file
        let window = {};
        eval(script);
        // The localization data is now in window.LocalizedMessage
        // Store the data to a JSON file
        writeFormattedJson(`${outputPath}/${region}-${language}.json`, window.LocalizedMessage);
    }
}
