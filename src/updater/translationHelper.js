// This file copies translations from SplatNet language files to our own language files

require('./bootstrap');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const { readJson } = require('./utilities');
const { languages } = require('../js/regions');
const SplatNet = require('./splatnet');

const sourcePath = path.resolve('storage/lang');
const destinationPath = path.resolve('src/locale');

function copyTranslation(source, destination) {
    for (let { region, language } of languages) {
        let sourceLang = readJson(`${sourcePath}/${region}-${language}.json`);
        let outputFile = `${destinationPath}/${language}.json`;
        let output = readJson(outputFile);
        console.log(`${language}: ${sourceLang[source]}`);
        _.setWith(output, destination, sourceLang[source], Object);
        fs.writeFileSync(outputFile, JSON.stringify(output, null, 4) + '\n');
    }
}

module.exports = {
    copyTranslation,
};

require('make-runnable/custom')({ printOutputFrame: false });
