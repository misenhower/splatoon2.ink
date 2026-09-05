import SchedulesUpdater from './updaters/SchedulesUpdater.js';
import CoopSchedulesUpdater from './updaters/CoopSchedulesUpdater.js';
import TimelineUpdater from './updaters/TimelineUpdater.js';
import OriginalGearImageUpdater from './updaters/OriginalGearImageUpdater.js';
import FestivalsUpdater from './updaters/FestivalsUpdater.js';
import MerchandisesUpdater from './updaters/MerchandisesUpdater.js';
import S3Syncer from '../sync/S3Syncer.js';
import { canSync } from '../sync/index.js';

/** @param {{ publicStorage: object, privateStorage: object }} storage */
export function createUpdaters(storage) {
    return [
        new OriginalGearImageUpdater(storage),
        new SchedulesUpdater(storage),
        new CoopSchedulesUpdater(storage),
        new TimelineUpdater(storage),
        new FestivalsUpdater('NA', storage),
        new FestivalsUpdater('EU', storage),
        new FestivalsUpdater('JP', storage),
        new MerchandisesUpdater(storage),
    ];
}

/**
 * Run every updater. `storage` is shared by all of them for the run (see createUpdaters);
 * a Worker passes BucketStorage over its R2 bindings, a local run passes FilesystemStorage.
 */
export default async function updateAll(storage) {
    const syncer = canSync() ? new S3Syncer() : null;

    for (let updater of createUpdaters(storage)) {
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
