const { canTweet } = require('./client');
const tweets = require('./tweets');

async function maybePostTweets() {
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
