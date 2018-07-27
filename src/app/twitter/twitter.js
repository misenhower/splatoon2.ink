const { canTweet } = require('./client');
const tweets = require('./tweets');

async function maybePostTweets() {
    if (!canTweet()) {
        console.warn('Twitter API parameters not specified');
        return;
    }

    for (let tweet of tweets)
        await tweet.maybePostTweet();
}

async function testScreenshots() {
    for (let tweet of tweets)
        await tweet.saveTestScreenshot();
}

module.exports = {
    maybePostTweets,
    testScreenshots,
}
