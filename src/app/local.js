// The local (Node) flavour of running the updaters: filesystem storage in the directories
// the site has always been built from. The Worker entry point has its own equivalent over R2.

import FilesystemStorage from '../common/storage/FilesystemStorage.js';
import { updateAll } from './updater/index.js';
import { maybePostTweets, testScreenshots } from './twitter/index.js';

export function filesystemStorage() {
    return {
        publicStorage: new FilesystemStorage('dist'),
        privateStorage: new FilesystemStorage('storage'),
    };
}

export async function updateAllLocally() {
    await updateAll(filesystemStorage());

    return 'Done';
}

export function postLocally() {
    return maybePostTweets(filesystemStorage());
}

export function testScreenshotsLocally() {
    return testScreenshots(filesystemStorage());
}
