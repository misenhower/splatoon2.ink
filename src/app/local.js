// The local (Node) flavour of running the updaters: filesystem storage in the directories
// the site has always been built from. The Worker entry point has its own equivalent over R2.

import FilesystemStorage from '../common/storage/FilesystemStorage.js';
import { updateAll } from './updater/index.js';
import { sendStatuses, testScreenshots } from './social/index.js';

export function filesystemStorage() {
    return {
        publicStorage: new FilesystemStorage('dist'),
        privateStorage: new FilesystemStorage('storage'),
    };
}

export async function updateAllLocally() {
    let updaters = await updateAll(filesystemStorage());
    if (updaters.some(updater => !updater.ok))
        throw new Error('One or more updaters failed; social posting skipped.');
    return 'Done';
}

export async function postLocally() {
    let result = await sendStatuses(filesystemStorage());
    if (!result.ok)
        throw new Error('One or more social posts failed.');
    return result;
}

export function testScreenshotsLocally() {
    return testScreenshots(filesystemStorage());
}
