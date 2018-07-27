const Updater = require('./Updater');
const path = require('path');
const fs = require('fs');
const dataPath = path.resolve('src/common/data');

class OriginalGearImageUpdater extends Updater {
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

module.exports = OriginalGearImageUpdater;
