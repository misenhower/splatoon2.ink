import tweets from './tweets/index.js';

export async function maybePostTweets() {
    for (let tweet of tweets)
        await tweet.maybePostTweet();
}

export async function testScreenshots() {
    for (let tweet of tweets)
        await tweet.saveTestScreenshot();
}
