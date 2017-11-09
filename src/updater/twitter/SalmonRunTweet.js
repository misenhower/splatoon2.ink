const TwitterPostBase = require('./TwitterPostBase');
const { captureSalmonRunScreenshot } = require('../screenshots');
const { readData } = require('./utilities');

class SalmonRunTweet extends TwitterPostBase {
    getKey() { return 'salmonrun'; }
    getName() { return 'Salmon Run'; }

    getSalmonRunSchedules() {
        let results = {};
        let coopSchedules = readData('coop-schedules.json');

        for (let schedule of coopSchedules.schedules)
            results[schedule.start_time] = schedule;

        for (let schedule of coopSchedules.details)
            results[schedule.start_time] = schedule;

        return Object.values(results);
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
