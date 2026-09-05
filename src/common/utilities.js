import fs from 'node:fs';
import path from 'node:path';
import { mkdirpSync as mkdirp } from 'mkdirp';
import stringify from 'json-stable-stringify';

const dataPath = path.resolve('dist/data');

export function getTopOfCurrentHour() {
    let date = new Date;
    date.setUTCMinutes(0);
    date.setUTCSeconds(0);
    return Math.floor(date.getTime() / 1000);
}

export function readJson(filename) {
    return JSON.parse(fs.readFileSync(filename));
}

/** Read a JSON file relative to a module, e.g. readJsonFile(new URL('./data/x.json', import.meta.url)) */
export function readJsonFile(url) {
    return JSON.parse(fs.readFileSync(url));
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
