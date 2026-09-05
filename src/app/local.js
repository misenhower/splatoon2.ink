// The local (Node) flavour of running the updaters: filesystem storage in the directories
// the site has always been built from, followed by the S3 upload when it is configured.
// The Worker entry point has its own equivalent over R2.

import FilesystemStorage from '../common/storage/FilesystemStorage.js';
import { updateAll } from './updater/index.js';
import S3Syncer from './sync/S3Syncer.js';
import { canSync } from './sync/index.js';

export function filesystemStorage() {
    return {
        publicStorage: new FilesystemStorage('dist'),
        privateStorage: new FilesystemStorage('storage'),
    };
}

export async function updateAllLocally() {
    await updateAll(filesystemStorage());

    if (canSync())
        await new S3Syncer().upload();

    return 'Done';
}
