const Updater = require('./Updater');
const SplatNet = require('../splatnet');
const { getOriginalGear } = require('../../js/splatoon');

class MerchandisesUpdater extends Updater {
    constructor() {
        super({
            name: 'Merchandises',
            filename: 'merchandises.json',
            request: (splatnet) => splatnet.getMerchandises(),
            rootKeys: ['merchandises'],
            imagePaths: [
                '$..gear.image',
                '$..gear.brand.image',
                '$..gear.brand.frequent_skill.image',
                '$..skill.image',
            ],
        });
    }

    processData(data) {
        for (let merchandise of data.merchandises)
            merchandise.original_gear = getOriginalGear(merchandise.gear);

        return data;
    }
}

module.exports = MerchandisesUpdater;
