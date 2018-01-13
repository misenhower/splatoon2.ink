require('./bootstrap');

const Updater = require('./updaters/Updater');
const SchedulesUpdater = require('./updaters/SchedulesUpdater');
const CoopSchedulesUpdater = require('./updaters/CoopSchedulesUpdater');
const TimelineUpdater = require('./updaters/TimelineUpdater');
const OriginalGearImageUpdater = require('./updaters/OriginalGearImageUpdater');
const FestivalsUpdater = require('./updaters/FestivalsUpdater');
const MerchandisesUpdater = require('./updaters/MerchandisesUpdater');

const updaters = [
    new OriginalGearImageUpdater,
    new SchedulesUpdater,
    new CoopSchedulesUpdater,
    new TimelineUpdater,
    new FestivalsUpdater('NA'),
    new FestivalsUpdater('EU'),
    new FestivalsUpdater('JP'),
    new MerchandisesUpdater,
];

async function updateAll() {
    for (let updater of updaters) {
        try {
            await updater.update();
        } catch (e) {
            console.error(e);
        }
    }

    return 'Done';
}

module.exports = {
    updateAll,
}

require('make-runnable/custom')({ printOutputFrame: false });
