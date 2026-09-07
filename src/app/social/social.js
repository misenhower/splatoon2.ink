import { createPosts } from './posts/index.js';
import BlueskyClient from './clients/BlueskyClient.js';

export function createClients() {
    return [new BlueskyClient];
}

/**
 * Post whatever is due for the current hour.
 * @param {{ publicStorage: object, privateStorage: object }} storage
 * @param {object[]} [clients]
 */
export async function sendStatuses(storage, clients = createClients()) {
    for (let post of createPosts(storage, clients))
        await post.maybePost();
}

export async function testScreenshots(storage, clients = createClients()) {
    for (let post of createPosts(storage, clients))
        await post.saveTestScreenshot();
}
