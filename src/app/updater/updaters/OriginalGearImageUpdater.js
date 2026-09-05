import Updater from './Updater.js';
import path from 'node:path';
import fs from 'node:fs';
const dataPath = path.resolve('src/common/data');

export default class OriginalGearImageUpdater extends Updater {
    constructor() {
        super({
            name: 'Original Gear',
            imagePaths: ['$..image'],
        });
    }

    async update() {
        // Get the list of skills
        let data = JSON.parse(fs.readFileSync(`${dataPath}/skills.json`));

        // Retrieve skill images
        await this.downloadImages(data);
    }
}
