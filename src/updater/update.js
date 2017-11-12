require('./bootstrap');
const splatnet = require('./splatnet');

const Updater = require('./updaters/Updater');
const OriginalGearImageUpdater = require('./updaters/OriginalGearImageUpdater');

const updaters = [
    // Original gear images
    new OriginalGearImageUpdater(),

    // Schedules
    new Updater({
        name: 'Schedules',
        filename: 'schedules.json',
        request: () => splatnet.getSchedules(),
        imagePaths: [
            '$..stage_a.image',
            '$..stage_b.image',
        ],
    }),

    // Co-op Schedules
    new Updater({
        name: 'Co-op Schedules',
        filename: 'coop-schedules.json',
        request: () => splatnet.getCoopSchedules(),
        imagePaths: [
            '$..stage.image',
            '$..weapons[*].image',
        ],
    }),

    // Timeline
    new Updater({
        name: 'Timeline',
        filename: 'timeline.json',
        request: () => splatnet.getTimeline(),
        rootKeys: ['coop', 'weapon_availability'],
        imagePaths: [
            '$.coop..gear.image',
            '$.coop..gear.brand.image',
            '$.weapon_availability..weapon.image',
            '$.weapon_availability..weapon.special.image_a',
            '$.weapon_availability..weapon.sub.image_a',
        ],
    }),

    // Festivals
    new Updater({
        name: 'Festivals',
        filename: 'festivals.json',
        async request() {
            return {
                na: await splatnet.getCombinedFestivals('NA'),
                eu: await splatnet.getCombinedFestivals('EU'),
                jp: await splatnet.getCombinedFestivals('JP'),
            };
        },
        imagePaths: [
            '$..images.alpha',
            '$..images.bravo',
            '$..images.panel',
            '$..special_stage.image',
        ],
    }),

    // Merchandises
    new Updater({
        name: 'Merchandises',
        filename: 'merchandises.json',
        request: () => splatnet.getMerchandises(),
        rootKeys: ['merchandises'],
        imagePaths: [
            '$..gear.image',
            '$..gear.brand.image',
            '$..gear.brand.frequent_skill.image',
            '$..skill.image',
        ],
    }),
];

async function updateAll() {
    for (let updater of updaters)
        await updater.update();

    return 'Done';
}

module.exports = {
    updateAll,
}

require('make-runnable/custom')({ printOutputFrame: false });
