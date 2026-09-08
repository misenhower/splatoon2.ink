import { logMessage } from '../log.js';
import SchedulesUpdater from './updaters/SchedulesUpdater.js';
import CoopSchedulesUpdater from './updaters/CoopSchedulesUpdater.js';
import TimelineUpdater from './updaters/TimelineUpdater.js';
import OriginalGearImageUpdater from './updaters/OriginalGearImageUpdater.js';
import FestivalsUpdater from './updaters/FestivalsUpdater.js';
import MerchandisesUpdater from './updaters/MerchandisesUpdater.js';

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
 * Run every updater (or the named ones). `storage` is shared by all of them for the run; a
 * Worker passes BucketStorage over its R2 bindings, a local run passes FilesystemStorage.
 * A failing updater is logged and does not stop the others.
 *
 * @param {object} storage
 * @param {{ only?: string[] }} [options]  restrict the run to updaters with these names
 * @returns {Promise<Array<{ name: string, ok: boolean, ms: number, error?: string }>>}
 */
export default async function updateAll(storage, { only } = {}) {
    let results = [];

    let updaters = createUpdaters(storage);

    if (only) {
        let unknown = only.filter(name => !updaters.some(updater => updater.options.name === name));

        if (!only.length || unknown.length)
            throw new Error(`Unknown or empty updater selection: ${unknown.join(', ')}`);
    }

    for (let updater of updaters) {
        let name = updater.options.name;

        if (only && !only.includes(name))
            continue;

        let started = Date.now();

        try {
            await updater.update();
            results.push({ name, ok: true, ms: Date.now() - started });
        } catch (e) {
            logMessage('error', e);
            results.push({
                name,
                ok: false,
                ms: Date.now() - started,
                error: e instanceof Error ? e.message : String(e),
            });
        }
    }

    return results;
}
