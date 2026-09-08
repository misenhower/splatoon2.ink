import { createPosts } from './posts/index.js';
import BlueskyClient from './clients/BlueskyClient.js';

export function createClients() {
    return [new BlueskyClient()];
}

/**
 * Post whatever is due for the current hour.
 * @param {{ publicStorage: object, privateStorage: object }} storage
 * @param {object[]} [clients]
 * @param {import('../screenshots/ScreenshotGenerator.js').default} screenshots
 */
export async function sendStatuses(storage, clients = createClients(), screenshots) {
    let posts = [];

    for (let post of createPosts(storage, clients, screenshots)) {
        let result = await post.maybePost();

        posts.push({ key: post.getKey(), ...(result || { ok: true, skipped: true }) });
    }

    return { ok: posts.every(post => post.ok), posts };
}

export async function testScreenshots(storage, clients = createClients(), screenshots) {
    for (let post of createPosts(storage, clients, screenshots))
        await post.saveTestScreenshot();
}
