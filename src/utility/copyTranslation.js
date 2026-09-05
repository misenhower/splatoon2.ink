// This file copies translations from SplatNet language files to our own language files

import path from 'node:path';
import fs from 'node:fs';
import _ from 'lodash';
import { readJson } from '../common/utilities.js';
import { languages } from '../common/regions.js';

const sourcePath = path.resolve('storage/lang');
const destinationPath = path.resolve('src/web/locale');

export default function copyTranslation(source, destination) {
    for (let { region, language } of languages) {
        let sourceLang = readJson(`${sourcePath}/${region}-${language}.json`);
        let outputFile = `${destinationPath}/${language}.json`;
        let output = readJson(outputFile);
        console.log(`${language}: ${sourceLang[source]}`);
        _.setWith(output, destination, sourceLang[source], Object);
        fs.writeFileSync(outputFile, JSON.stringify(output, null, 4) + '\n');
    }
}
