import Updater from './Updater.js';
import { readJsonFile } from '../../../common/utilities.js';

export default class OriginalGearImageUpdater extends Updater {
    constructor(storage) {
        super({
            name: 'Original Gear',
            imagePaths: ['$..image'],
        }, storage);
    }

    async update() {
        // Get the list of skills
        let data = readJsonFile(new URL('../../../common/data/skills.json', import.meta.url));

        // Retrieve skill images
        await this.downloadImages(data);
    }
}
