require('../bootstrap');
const Twitter = require('twitter');

// Twitter API parameters
const consumer_key = process.env.TWITTER_CONSUMER_KEY;
const consumer_secret = process.env.TWITTER_CONSUMER_SECRET;
const access_token_key = process.env.TWITTER_ACCESS_TOKEN_KEY;
const access_token_secret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

// Twitter API client
const client = new Twitter({ consumer_key, consumer_secret, access_token_key, access_token_secret });
module.exports.client = client;

function canTweet() {
    return consumer_key && consumer_secret && access_token_key && access_token_secret;
}
module.exports.canTweet = canTweet;

function postMediaTweet(text, image) {
    return new Promise((resolve, reject) => {
        // Upload the image
        client.post('media/upload', { media: image }, (error, media, response) => {
            if (error)
                return reject(error);

            let status = {
                status: text,
                media_ids: media.media_id_string,
            };

            client.post('statuses/update', status, (error, tweet, response) => {
                if (error)
                    return reject(error);

                resolve(tweet);
            });
        });
    });
}
module.exports.postMediaTweet = postMediaTweet;
