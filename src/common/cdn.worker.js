// Images that SplatNet's CDN no longer serves, embedded in the Worker bundle: the "Data"
// module rule in workers/updater/wrangler.jsonc turns each PNG import into its bytes.
// Under Node, cdn.node.js reads the same files from disk instead.

import skill53c62995 from './cdn/images/skill/53c62995f9d2dc4a60f3850c5dbdd2323f1eef87.png';

const images = {
    '/images/skill/53c62995f9d2dc4a60f3850c5dbdd2323f1eef87.png': skill53c62995,
};

/** @returns {Promise<Uint8Array | null>} the image bytes, or null if SplatNet still serves this path */
export async function cdnBackup(imagePath) {
    let data = images[imagePath];
    return data ? new Uint8Array(data) : null;
}
