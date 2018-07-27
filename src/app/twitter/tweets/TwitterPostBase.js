const path = require('path');
const fs = require('fs');
const { postMediaTweet } = require('../client');
const { getTopOfCurrentHour, readJson, writeJson } = require('@/common/utilities');

const lastTweetTimesPath = path.resolve('storage/twitter-lastTweetTimes.json');

class TwitterPostBase {
    maybePostTweet() {
        // Make sure we have data to post
        if (!this.getData()) {
            this.info('No data to post');
            return false;
        }

        if (!this.shouldPostForCurrentTime()) {
            this.info('Already posted for this time');
            return false;
        }

        return this.postTweet();
    }

    async postTweet() {
        try {
            // Get the Tweet's text and image
            let data = this.getData();
            let text = await this.getText(data);
            let image = await this.getImage(data);

            // Post to Twitter
            let tweet = await postMediaTweet(text, image);

            // Update the last post time
            this.updateLastTweetTime();

            this.info('Posted Tweet');
        }
        catch (e) {
            this.error('Couldn\'t post Tweet');
            console.error(e);
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

    getLastTweetTimes() {
        if (fs.existsSync(lastTweetTimesPath))
            return readJson(lastTweetTimesPath);
        return {};
    }

    getLastTweetTime() {
        let key = this.getKey();
        return this.getLastTweetTimes()[key] || 0;
    }

    updateLastTweetTime() {
        let key = this.getKey();
        let time = this.getDataTime();
        let lastTweetTimes = this.getLastTweetTimes();

        lastTweetTimes[key] = time;

        writeJson(lastTweetTimesPath, lastTweetTimes);
    }

    shouldPostForCurrentTime() {
        // Check whether the current data time has already been posted
        let time = this.getDataTime();
        let lastTweetTime = this.getLastTweetTime();
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

    // The text body of the Tweet
    getText(data) { }

    // The filename for test screenshots
    getTestScreenshotFilename() {
        let key = this.getKey();
        return `test-screenshot-${key}.png`;
    }
}

module.exports = TwitterPostBase;
