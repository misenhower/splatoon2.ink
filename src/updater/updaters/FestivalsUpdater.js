const Updater = require('./Updater');
const mkdirp = require('mkdirp');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const jsonpath = require('jsonpath');
const { readJson } = require('../utilities');
const { languages } = require('../../js/regions');

class FestivalsUpdater extends Updater {
    constructor(region) {
        super({
            name: `Festivals ${region}`,
            filename: 'festivals.json',
            request: (splatnet) => splatnet.getCombinedFestivals(),
            imagePaths: [
                '$..images.alpha',
                '$..images.bravo',
                '$..images.panel',
                '$..special_stage.image',
            ],
            localization: [
                {
                    name: 'festivals',
                    entities: '$.festivals[*]',
                    id: 'festival_id',
                    values: 'names',
                },
                {
                    name: 'stages',
                    entities: '$..special_stage',
                    id: 'id',
                    values: 'name',
                },
            ],
        });

        this.region = region;
    }

    processData(regionData) {
        // Fix alpha/bravo images for the Chicken vs. Egg Splatfest.
        // For some reason these got swapped out with images that have an opaque background
        // even though they started out with transparent images.
        jsonpath.apply(regionData, '$..images.alpha', value => value.replace(
            "/images/festival/a070cc6b405b4fb335992d824097acd8.png",
            "/images/festival/06b3b0b7773d9e6c4ac0a5cc5371fc32.png"
        ));
        jsonpath.apply(regionData, '$..images.bravo', value => value.replace(
            "/images/festival/00e4c5fdccd3720d07127084fc1f4152.png",
            "/images/festival/d93df77468714c6211e9377f39a559f4.png"
        ));

        // Load existing data since we only need to modify this region's data
        let data = {};
        let filename = this.getFilename();
        if (fs.existsSync(filename))
            data = readJson(filename);

        let region = this.region.toLowerCase();
        data[region] = regionData;

        return data;
    }

    getLanguages() {
        // Return all languages for this region
        return _.filter(languages, { region: this.region });
    }
}

module.exports = FestivalsUpdater;
