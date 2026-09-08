// Node entry points use filesystem storage in the directories
// the site has always been built from. The Worker entry point has its own equivalent over R2.

import FilesystemStorage from '../common/storage/FilesystemStorage.js';
import * as updater from './updater/index.js';
import * as social from './social/index.js';
import { withScreenshots } from './screenshots/node.js';

export function filesystemStorage() {
    return {
        publicStorage: new FilesystemStorage('dist'),
        privateStorage: new FilesystemStorage('storage'),
    };
}

export async function updateAll() {
    let updaters = await updater.updateAll(filesystemStorage());

    if (updaters.some(updater => !updater.ok))
        throw new Error('One or more updaters failed; social posting skipped.');

    return 'Done';
}

export async function sendStatuses() {
    let clients = social.createClients();
    let result = await withScreenshots(screenshots =>
        social.sendStatuses(filesystemStorage(), clients, screenshots),
    );

    if (!result.ok)
        throw new Error('One or more social posts failed.');

    return result;
}

export function testScreenshots() {
    return withScreenshots(screenshots => social.testScreenshots(filesystemStorage(), [], screenshots));
}
