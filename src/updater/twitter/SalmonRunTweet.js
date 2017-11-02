const TwitterPostBase = require('./TwitterPostBase');
const { captureSalmonRunScreenshot } = require('../screenshots');
const { readData } = require('./utilities');

class SalmonRunTweet extends TwitterPostBase {
    getKey() { return 'salmonrun'; }
    getName() { return 'Salmon Run'; }

    getSalmonRunSchedules() {
        let schedules = {};

        let timeline = readData('timeline.json').coop;
        if (timeline)
            schedules[timeline.start_time] = timeline;

        let calendar = readData('salmonruncalendar.json').schedules;
        if (calendar) {
            for (let schedule of calendar)
                schedules[schedule.start_time] = schedule;
        }

        return Object.values(schedules);
    }

    getData() {
        return this.getSalmonRunSchedules().find(s => s.start_time == this.getDataTime());
    }

    getTestData() {
        return this.getSalmonRunSchedules()[0];
    }

    getImage(data) {
        return captureSalmonRunScreenshot(data.start_time);
    }

    getText(data) {
        return 'Salmon Run is now open! #salmonrun #splatoon2';
    }
}

module.exports = SalmonRunTweet;
