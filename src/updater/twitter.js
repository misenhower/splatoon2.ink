require('./bootstrap');
const { canTweet } = require('./twitter/client');
const ScheduleTweet = require('./twitter/ScheduleTweet');
const GearTweet = require('./twitter/GearTweet');
const SalmonRunTweet = require('./twitter/SalmonRunTweet');
const NewWeaponTweet = require('./twitter/NewWeaponTweet');

let tweets = [
    new ScheduleTweet,
    new GearTweet,
    new SalmonRunTweet,
    new NewWeaponTweet,
];

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

require('make-runnable/custom')({ printOutputFrame: false });
