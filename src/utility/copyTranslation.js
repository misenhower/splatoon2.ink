// This file copies translations from SplatNet language files to our own language files

const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const { readJson } = require('@/common/utilities');
const { languages } = require('@/common/regions');

const sourcePath = path.resolve('storage/lang');
const destinationPath = path.resolve('src/web/locale');

module.exports = function (source, destination) {
    for (let { region, language } of languages) {
        let sourceLang = readJson(`${sourcePath}/${region}-${language}.json`);
        let outputFile = `${destinationPath}/${language}.json`;
        let output = readJson(outputFile);
        console.log(`${language}: ${sourceLang[source]}`);
        _.setWith(output, destination, sourceLang[source], Object);
        fs.writeFileSync(outputFile, JSON.stringify(output, null, 4) + '\n');
    }
}
