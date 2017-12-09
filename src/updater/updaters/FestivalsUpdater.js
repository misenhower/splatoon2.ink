const Updater = require('./Updater');
const mkdirp = require('mkdirp');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
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
