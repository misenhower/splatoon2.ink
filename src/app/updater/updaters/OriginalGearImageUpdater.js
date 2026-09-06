import Updater from './Updater.js';
import skills from '../../../common/data/skills.json' with { type: 'json' };

export default class OriginalGearImageUpdater extends Updater {
    constructor(storage) {
        super({
            name: 'Original Gear',
            imagePaths: ['$..image'],
        }, storage);
    }

    async update() {
        this.startSummary();

        // Get the list of skills
        let data = skills;

        // Retrieve skill images
        await this.downloadImages(data);
        this.lap('images');

        return this.finishSummary();
    }
}
