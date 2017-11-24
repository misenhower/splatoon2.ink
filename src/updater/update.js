require('./bootstrap');

const Updater = require('./updaters/Updater');
const OriginalGearImageUpdater = require('./updaters/OriginalGearImageUpdater');
const FestivalsUpdater = require('./updaters/FestivalsUpdater');
const MerchandisesUpdater = require('./updaters/MerchandisesUpdater');

const updaters = [
    // Original gear images
    new OriginalGearImageUpdater(),

    // Schedules
    new Updater({
        name: 'Schedules',
        filename: 'schedules.json',
        request: (splatnet) => splatnet.getSchedules(),
        imagePaths: [
            '$..stage_a.image',
            '$..stage_b.image',
        ],
    }),

    // Co-op Schedules
    new Updater({
        name: 'Co-op Schedules',
        filename: 'coop-schedules.json',
        request: (splatnet) => splatnet.getCoopSchedules(),
        imagePaths: [
            '$..stage.image',
            '$..weapons[*].image',
        ],
    }),

    // Timeline
    new Updater({
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
    }),

    // Festivals
    new FestivalsUpdater,

    // Merchandises
    new MerchandisesUpdater,
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
