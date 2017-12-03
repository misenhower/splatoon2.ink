const Updater = require('./Updater');

class TimelineUpdater extends Updater {
    constructor() {
        super({
            name: 'Timeline',
            filename: 'timeline.json',
            request: (splatnet) => splatnet.getTimeline(),
            rootKeys: ['coop', 'weapon_availability'],
            imagePaths: [
                '$.coop..gear.image',
                '$.coop..gear.brand.image',
                '$.weapon_availability..weapon.image',
                '$.weapon_availability..weapon.special.image_a',
                '$.weapon_availability..weapon.sub.image_a',
            ],
            localization: [
                {
                    name: 'gear',
                    entities: '$.coop..gear',
                    id: 'id',
                    values: 'name',
                },
                {
                    name: 'brands',
                    entities: '$.coop..gear.brand',
                    id: 'id',
                    values: 'name',
                },
                {
                    name: 'weapons',
                    entities: '$.weapon_availability..weapon',
                    id: 'id',
                    values: 'name',
                },
                {
                    name: 'weapon_subs',
                    entities: '$.weapon_availability..weapon.sub',
                    id: 'id',
                    values: 'name',
                },
                {
                    name: 'weapon_specials',
                    entities: '$.weapon_availability..weapon.special',
                    id: 'id',
                    values: 'name',
                },
            ],
        });
    }
}

module.exports = TimelineUpdater;
