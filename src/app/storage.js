import { FilesystemStorage } from '../common/storage/index.js';

/**
 * The storage a local (Node) run uses: the same directories the site has always been
 * built from, so `npm run splatnet` and the S3 sync keep working unchanged.
 */
export function filesystemStorage() {
    return {
        publicStorage: new FilesystemStorage('dist'),
        privateStorage: new FilesystemStorage('storage'),
    };
}
