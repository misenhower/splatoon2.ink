import SchedulesUpdater from './updaters/SchedulesUpdater.js';
import CoopSchedulesUpdater from './updaters/CoopSchedulesUpdater.js';
import TimelineUpdater from './updaters/TimelineUpdater.js';
import OriginalGearImageUpdater from './updaters/OriginalGearImageUpdater.js';
import FestivalsUpdater from './updaters/FestivalsUpdater.js';
import MerchandisesUpdater from './updaters/MerchandisesUpdater.js';
import S3Syncer from '../sync/S3Syncer.js';
import { canSync } from '../sync/index.js';

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

export default async function updateAll() {
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
