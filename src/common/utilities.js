import fs from 'node:fs';
import path from 'node:path';
import { mkdirpSync as mkdirp } from 'mkdirp';
import stringify from 'json-stable-stringify';

export function readJson(filename) {
    return JSON.parse(fs.readFileSync(filename));
}

export function writeFormattedJson(filename, data) {
    mkdirp(path.dirname(filename));
    fs.writeFileSync(filename, stringify(data, { space: 4 }));
}
