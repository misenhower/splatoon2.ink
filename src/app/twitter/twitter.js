import S3Syncer from '../sync/S3Syncer.js';
import { canSync } from '../sync/index.js';
import tweets from './tweets/index.js';

export async function maybePostTweets() {
    const syncer = canSync() ? new S3Syncer() : null;

    for (let tweet of tweets)
        await tweet.maybePostTweet();

    if (syncer) {
        await syncer.upload();
    }
}

export async function testScreenshots() {
    for (let tweet of tweets)
        await tweet.saveTestScreenshot();
}
