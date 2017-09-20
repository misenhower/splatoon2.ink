require('./bootstrap');
const screenshots = require('./screenshots');
const Twitter = require('twitter');
const path = require('path');
const fs = require('fs');

const dataPath = path.resolve('public/data');
const lastTweetTimesPath = path.resolve('twitter-lastTweetTimes.json');

// Twitter API parameters
const consumer_key = process.env.TWITTER_CONSUMER_KEY;
const consumer_secret = process.env.TWITTER_CONSUMER_SECRET;
const access_token_key = process.env.TWITTER_ACCESS_TOKEN_KEY;
const access_token_secret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

// Twitter API client
const client = new Twitter({ consumer_key, consumer_secret, access_token_key, access_token_secret });

/**
 * Utilities
 */

function canTweet() {
    return consumer_key && consumer_secret && access_token_key && access_token_secret;
}

function getTopOfCurrentHour() {
    let date = new Date;
    date.setUTCMinutes(0);
    date.setUTCSeconds(0);
    return Math.floor(date.getTime() / 1000);
}

function getLastTweetTimes() {
    if (fs.existsSync(lastTweetTimesPath))
        return JSON.parse(fs.readFileSync(lastTweetTimesPath));
    return {};
}

function getLastTweetTime(key) {
    return getLastTweetTimes()[key] || 0;
}

function shouldTweet(key, time) {
    return getLastTweetTime(key) < time;
}

function updateLastTweetTime(key, time) {
    let lastTweetTimes = getLastTweetTimes();
    lastTweetTimes[key] = time;

    fs.writeFileSync(lastTweetTimesPath, JSON.stringify(lastTweetTimes));
}

/**
 * Twitter posts
 */

async function maybePostTweets() {
    if (!canTweet()) {
        console.warn('Twitter API parameters not specified');
        return;
    }

    await maybePostScheduleTweet();
}

/**
 * Main schedule tweets
 */

async function maybePostScheduleTweet() {
    const key = 'schedule';

    // What time are we posting the schedule for?
    let time = getTopOfCurrentHour();

    // Have we already posted for this time?
    if (!shouldTweet(key, time)) {
        console.info('Twitter: Schedule: Already posted for this hour');
        return;
    }

    // Get the schedules
    let schedulesPath = `${dataPath}/schedules.json`;
    if (!fs.existsSync(schedulesPath)) {
        console.warn('Twitter: Schedule: schedules.json does not exist');
        return;
    }
    let schedules = JSON.parse(fs.readFileSync(schedulesPath));

    // Do we have a schedule for the specified time?
    if (!schedules.regular.find(s => s.start_time == time)) {
        console.info('Twitter: Schedule: No schedule for this hour')
        return;
    }

    // Everything looks good, let's post a tweet
    await postScheduleTweet(time);

    // Update the last tweet time
    updateLastTweetTime(key, time);
}

function postScheduleTweet(startTime) {
    return new Promise(async (resolve, reject) => {
        // Generate the image
        let imageData = await screenshots.captureScheduleScreenshot(startTime);

        // Upload the image
        client.post('media/upload', { media: imageData }, (error, media, response) => {
            if (error)
                return reject(error);

            let status = {
                status: 'Current Splatoon 2 map rotation, via https://splatoon2.ink #splatoon2',
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

module.exports = {
    maybePostTweets,
}

require('make-runnable/custom')({ printOutputFrame: false });
