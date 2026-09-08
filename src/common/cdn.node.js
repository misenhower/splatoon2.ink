// Images that SplatNet's CDN no longer serves, read from the repo under Node. The Worker
// build uses cdn.worker.js instead (selected by the "#cdn-images" import condition in
// package.json), where the same files are embedded in the bundle.

import { readFile } from 'node:fs/promises';

const images = {
    '/images/skill/53c62995f9d2dc4a60f3850c5dbdd2323f1eef87.png': new URL(
        './cdn/images/skill/53c62995f9d2dc4a60f3850c5dbdd2323f1eef87.png',
        import.meta.url,
    ),
};

/** @returns {Promise<Uint8Array | null>} the image bytes, or null if SplatNet still serves this path */
export async function cdnBackup(imagePath) {
    let file = images[imagePath];

    return file ? new Uint8Array(await readFile(file)) : null;
}
