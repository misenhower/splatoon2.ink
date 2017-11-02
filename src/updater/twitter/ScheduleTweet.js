const TwitterPostBase = require('./TwitterPostBase');
const { captureScheduleScreenshot } = require('../screenshots');
const { readData } = require('./utilities');

class ScheduleTweet extends TwitterPostBase {
    getKey() { return 'schedule'; }
    getName() { return 'Schedule'; }

    getSchedules() {
        return readData('schedules.json');
    }

    getData() {
        return this.getSchedules().regular.find(s => s.start_time == this.getDataTime());
    }

    getTestData() {
        return this.getSchedules().regular[0];
    }

    getImage(data) {
        return captureScheduleScreenshot(data.start_time);
    }

    getText(data) {
        return 'Current Splatoon 2 map rotation';
    }
}

module.exports = ScheduleTweet;
