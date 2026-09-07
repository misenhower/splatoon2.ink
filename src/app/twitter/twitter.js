import { createTweets } from './tweets/index.js';
import BlueskyClient from './clients/BlueskyClient.js';
import TwitterClient from './clients/TwitterClient.js';

export function createClients() {
    return [new BlueskyClient, new TwitterClient];
}

/**
 * Post whatever is due for the current hour.
 * @param {{ publicStorage: object, privateStorage: object }} storage
 * @param {object[]} [clients]
 */
export async function maybePostTweets(storage, clients = createClients()) {
    for (let tweet of createTweets(storage, clients))
        await tweet.maybePostTweet();
}

export async function testScreenshots(storage, clients = createClients()) {
    for (let tweet of createTweets(storage, clients))
        await tweet.saveTestScreenshot();
}
