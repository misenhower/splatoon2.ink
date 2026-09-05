import fs from 'node:fs';
import path from 'node:path';
import { mkdirpSync as mkdirp } from 'mkdirp';
import stringify from 'json-stable-stringify';

const dataPath = path.resolve('dist/data');

export function readJson(filename) {
    return JSON.parse(fs.readFileSync(filename));
}

export function writeJson(filename, data) {
    mkdirp(path.dirname(filename));
    fs.writeFileSync(filename, JSON.stringify(data));
}

export function writeFormattedJson(filename, data) {
    mkdirp(path.dirname(filename));
    fs.writeFileSync(filename, stringify(data, { space: 4 }));
}

export function readData(filename) {
    return readJson(`${dataPath}/${filename}`);
}
