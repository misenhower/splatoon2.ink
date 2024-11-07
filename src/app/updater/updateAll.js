const SchedulesUpdater = require('./updaters/SchedulesUpdater');
const CoopSchedulesUpdater = require('./updaters/CoopSchedulesUpdater');
const TimelineUpdater = require('./updaters/TimelineUpdater');
const OriginalGearImageUpdater = require('./updaters/OriginalGearImageUpdater');
const FestivalsUpdater = require('./updaters/FestivalsUpdater');
const MerchandisesUpdater = require('./updaters/MerchandisesUpdater');
const S3Syncer = require('../sync/S3Syncer');
const { canSync } = require('../sync');

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
    const syncer = canSync() ? new S3Syncer() : null;

    for (let updater of updaters) {
        try {
            await updater.update();
        } catch (e) {
            console.error(e);
        }
    }

    if (syncer) {
        await syncer.upload();
    }

    return 'Done';
}

module.exports = updateAll;
