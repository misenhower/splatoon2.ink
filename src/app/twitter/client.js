const { TwitterApi } = require("twitter-api-v2");

// Twitter API parameters
const appKey = process.env.TWITTER_CONSUMER_KEY;
const appSecret = process.env.TWITTER_CONSUMER_SECRET;
const accessToken = process.env.TWITTER_ACCESS_TOKEN_KEY;
const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

// Twitter API client
function getClient() {
    return new TwitterApi({
        appKey,
        appSecret,
        accessToken,
        accessSecret,
    });
}

function canTweet() {
    return appKey && appSecret && accessToken && accessSecret;
}
module.exports.canTweet = canTweet;

async function postMediaTweet(text, image) {
    let client = getClient();

    // Upload images
    let mediaId = await client.v1.uploadMedia(image, { mimeType: 'image/png' });

    // Send status
    await client.v2.tweet(text, { media: { media_ids: [mediaId] } });
}
module.exports.postMediaTweet = postMediaTweet;
