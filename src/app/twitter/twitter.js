const S3Syncer = require('../sync/S3Syncer');
const { canSync } = require('../sync');
const tweets = require('./tweets');

async function maybePostTweets() {
    const syncer = canSync() ? new S3Syncer() : null;

    for (let tweet of tweets)
        await tweet.maybePostTweet();

    if (syncer) {
        await syncer.upload();
    }
}

async function testScreenshots() {
    for (let tweet of tweets)
        await tweet.saveTestScreenshot();
}

module.exports = {
    maybePostTweets,
    testScreenshots,
}
