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

function postMediaTweet(imageData, statusText) {
    return new Promise((resolve, reject) => {
        // Upload the image
        client.post('media/upload', { media: imageData }, (error, media, response) => {
            if (error)
                return reject(error);

            let status = {
                status: statusText,
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

/**
 * Twitter posts
 */

async function maybePostTweets() {
    if (!canTweet()) {
        console.warn('Twitter API parameters not specified');
        return;
    }

    await maybePostScheduleTweet();
    await maybePostGearTweet();
    await maybePostSalmonRunTweet();
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
        console.info('Twitter: Schedule: No schedule for this hour');
        return;
    }

    // Everything looks good, let's post a tweet
    await postScheduleTweet(time);
    console.info('Twitter: Schedule: Posted latest map schedule');

    // Update the last tweet time
    updateLastTweetTime(key, time);
}

async function postScheduleTweet(startTime) {
    // Generate the image
    let imageData = await screenshots.captureScheduleScreenshot(startTime);

    // Post the tweet
    return await postMediaTweet(imageData, 'Current Splatoon 2 map rotation (via https://splatoon2.ink) #splatoon2');
}

/**
 * Gear tweets
 */

function getMerchandises() {
    let merchandisesPath = `${dataPath}/merchandises.json`;
    if (!fs.existsSync(merchandisesPath)) {
        console.warn('Twitter: Gear: merchandises.json does not exist');
        return [];
    }
    return JSON.parse(fs.readFileSync(merchandisesPath)).merchandises;
}

async function maybePostGearTweet() {
    const key = 'gear';

    // What time are we posting the schedule for?
    let time = getTopOfCurrentHour();

    // Make sure we have merchandises
    let merchandises = getMerchandises();
    if (!merchandises.length) {
        console.info('Twitter: Gear: No merchandises');
        return;
    }

    // This one is a little different: we only have end_times for merchandise items, so we
    // need to track the latest end_time we've posted
    let endTimes = merchandises.map(m => m.end_time);
    let lastEndTime = Math.max(...endTimes);

    // Have we already posted for this time?
    if (!shouldTweet(key, lastEndTime))  {
        console.info('Twitter: Gear: Already posted for this hour');
        return;
    }

    // Everything looks good, let's post a tweet
    await postGearTweet(time, lastEndTime);
    console.info('Twitter: Gear: Posted latest SplatNet gear');

    // Update the last tweet time
    updateLastTweetTime(key, lastEndTime);
}

async function postGearTweet(startTime, endTime) {
    // Generate the image
    let imageData = await screenshots.captureGearScreenshot(startTime, endTime);

    // Generate the text
    let gearText;
    let merchandise = getMerchandises().find(g => g.end_time == endTime);
    if (!merchandise)
        return;
    gearText = `Up now on SplatNet: ${merchandise.gear.name} with ${merchandise.skill.name} (via https://splatoon2.ink) #splatoon2 #splatnet2`;

    // Post the tweet
    return await postMediaTweet(imageData, gearText);
}

/**
 * Salmon Run tweets
 */

function getSalmonRunSchedules() {
    let timelinePath = `${dataPath}/timeline.json`;
    let calendarPath = `${dataPath}/salmonruncalendar.json`;
    let schedules = {};

    if (fs.existsSync(timelinePath)) {
        let timeline = JSON.parse(fs.readFileSync(timelinePath)).coop;
        if (timeline)
            schedules[timeline.start_time] = timeline;
    }

    if (fs.existsSync(calendarPath)) {
        let calendar = JSON.parse(fs.readFileSync(calendarPath)).schedules;
        if (calendar) {
            for (schedule of calendar)
                schedules[schedule.start_time] = schedule;
        }
    }

    return Object.values(schedules);
}

async function maybePostSalmonRunTweet() {
    const key = 'salmonrun';

    // What time are we posting the schedule for?
    let time = getTopOfCurrentHour();

    // Have we already posted for this time?
    if (!shouldTweet(key, time)) {
        console.info('Twitter: Salmon Run: Already posted for this hour');
        return;
    }

    // Get the schedules
    let schedules = getSalmonRunSchedules();
    if (!schedules.length) {
        console.warn('Twitter: Salmon Run: no schedules found');
        return;
    }

    // Do we have a schedule for the specified time?
    if (!schedules.find(s => s.start_time == time)) {
        console.info('Twitter: Salmon Run: No schedule for this hour');
        return;
    }

    // Everything looks good, let's post a tweet
    await postSalmonRunTweet(time);
    console.info('Twitter: Salmon Run: Posted Salmon Run schedule');

    // Update the last tweet time
    updateLastTweetTime(key, time);
}

async function postSalmonRunTweet(startTime) {
    // Generate the image
    let imageData = await screenshots.captureSalmonRunScreenshot(startTime);

    // Post the tweet
    return await postMediaTweet(imageData, 'Salmon Run is now open! (via https://splatoon2.ink) #splatoon2 #salmonrun');
}

module.exports = {
    maybePostTweets,
    postScheduleTweet,
    postGearTweet,
    postSalmonRunTweet,
}

require('make-runnable/custom')({ printOutputFrame: false });
