const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp').sync;
const BlueskyClient = require('../clients/BlueskyClient');
const TwitterClient = require('../clients/TwitterClient');
const { getTopOfCurrentHour, readJson, writeJson } = require('@/common/utilities');

const blueskyLastTimesPath = path.resolve('storage/bluesky-lastPostTimes.json');
const twitterLastTimesPath = path.resolve('storage/twitter-lastTweetTimes.json');

const blueskyClient = new BlueskyClient();
const twitterClient = new TwitterClient();

class TwitterPostBase {
    async maybePostTweet() {
        // Make sure we have data to post
        if (!this.getData()) {
            this.info('No data to post');
            return false;
        }

        if (!this.shouldPostForCurrentTime(blueskyClient) && !this.shouldPostForCurrentTime(twitterClient)) {
            this.info('Already posted for this time');
            return false;
        }

        // Make sure we can post or save to a file
        if (!await this.canPost() && !this.getPublicImageFilename()) {
            this.error('Twitter API parameters not specified');
            return false;
        }

        return this.postTweet();
    }

    async canPost() {
        return await blueskyClient.canSend()
            || await twitterClient.canSend();
    }

    async postTweet() {
        try {
            // Get the Tweet's text and image
            let data = this.getData();
            let text = await this.getText(data);
            let image = await this.getImage(data);

            // Maybe save the image
            this.maybeSavePublicImage(data, image);

            let status = {
                status: text,
                media: [{ file: image, type: 'image/png' }],
            };

            for (let client of [blueskyClient, twitterClient]) {
                if (!await client.canSend()) {
                    continue;
                }

                try {
                    await client.send(status);
                    this.updateLastTweetTime(client);
                    this.info(`Posted to ${client.name}`);
                } catch (e) {
                    this.error(`Couldn't post to ${client.name}`);
                    console.error(e);
                }
            }
        }
        catch (e) {
            this.error('Couldn\'t post Tweet');
            console.error(e);
        }
    }

    maybeSavePublicImage(data, image) {
        let filename = this.getPublicImageFilename();
        if (filename) {
            let outputFilename = path.resolve(`dist/twitter-images/${filename}`);
            mkdirp(path.dirname(outputFilename));
            fs.writeFileSync(outputFilename, image);
            this.info(`Saved public image as ${filename}`);
        }
    }

    async saveTestScreenshot() {
        try {
            let data = this.getTestData();
            if (!data) {
                this.info('No data available');
                return;
            }

            let filename = this.getTestScreenshotFilename();
            let image = await this.getImage(data);

            fs.writeFileSync(filename, image);
            this.info('Saved screenshot')
        }
        catch (e) {
            this.error('Couldn\'t save screenshot');
            console.error(e);
        }
    }

    /**
     * Post time helpers
     */

    getLastTweetTimesPath(client) {
        switch (client.key) {
            case 'bluesky': return blueskyLastTimesPath;
            case 'twitter': return twitterLastTimesPath;
        }
    }

    getLastTweetTimes(client) {
        let lastTimesPath = this.getLastTweetTimesPath(client);

        if (fs.existsSync(lastTimesPath))
            return readJson(lastTimesPath);
        return {};
    }

    getLastTweetTime(client) {
        let key = this.getKey();
        return this.getLastTweetTimes(client)[key] || 0;
    }

    updateLastTweetTime(client) {
        let key = this.getKey();
        let time = this.getDataTime();
        let lastTweetTimes = this.getLastTweetTimes(client);

        lastTweetTimes[key] = time;

        writeJson(this.getLastTweetTimesPath(client), lastTweetTimes);
    }

    shouldPostForCurrentTime(client) {
        // Check whether the current data time has already been posted
        let time = this.getDataTime();
        let lastTweetTime = this.getLastTweetTime(client);
        return lastTweetTime < time;
    }

    /**
     * Log helpers
     */

    formatLogMessage(message) {
        let name = this.getName();
        return `[Twitter] [${name}] ${message}`;
    }

    log(message) {
        console.log(this.formatLogMessage(message));
    }

    info(message) {
        console.info(this.formatLogMessage(message));
    }

    error(message) {
        console.error(this.formatLogMessage(message));
    }

    /**
     * Overridable methods
     */

    // The unique key for this Tweet (used for storing the last time this Tweet was posted)
    getKey() { }

    // The friendly name for this Tweet (used for console log messages)
    getName() { }

    // The time which the current Tweet is based off of (usually the top of the current hour)
    getDataTime() {
        return getTopOfCurrentHour();
    }

    // The current data item the Tweet is based on (used by getImage and getText)
    getData() { }

    // Data for test screenshots
    getTestData() {
        return this.getData();
    }

    // The image data to be posted with the Tweet
    getImage(data) { }

    // The filename to store the image as (optional)
    getPublicImageFilename() { }

    // The text body of the Tweet
    getText(data) { }

    // The filename for test screenshots
    getTestScreenshotFilename() {
        let key = this.getKey();
        return `test-screenshot-${key}.png`;
    }

    getMaxTweetLength() {
        return 280;
    }
}

module.exports = TwitterPostBase;
