const Updater = require('./Updater');
const SplatNet = require('@/common/splatnet');
const { getOriginalGear } = require('@/common/splatoon');

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
            localization: [
                {
                    name: 'gear',
                    entities: '$..gear',
                    id: ['kind', 'id'],
                    values: 'name',
                },
                {
                    name: 'brands',
                    entities: '$..gear.brand',
                    id: 'id',
                    values: 'name',
                },
                {
                    name: 'skills',
                    entities: '$..gear.brand.frequent_skill',
                    id: 'id',
                    values: 'name',
                },
                {
                    name: 'skills',
                    entities: '$..skill',
                    id: 'id',
                    values: 'name',
                },
            ],
        });
    }

    processData(data) {
        for (let merchandise of data.merchandises) {
            let originalGear = getOriginalGear(merchandise.gear);

            // We don't need the brand data since it should match the SplatNet gear's brand
            if (originalGear)
                delete originalGear.brand

            merchandise.original_gear = originalGear;
        }

        return data;
    }
}

module.exports = MerchandisesUpdater;
