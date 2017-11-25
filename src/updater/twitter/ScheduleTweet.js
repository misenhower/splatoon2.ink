const TwitterPostBase = require('./TwitterPostBase');
const { captureScheduleScreenshot } = require('../screenshots');
const { readData, readJson } = require('../utilities');
const path = require('path');

const stagesPath = path.resolve('storage/stages.json');

class ScheduleTweet extends TwitterPostBase {
    getKey() { return 'schedule'; }
    getName() { return 'Schedule'; }

    getSchedules() {
        return readData('schedules.json');
    }

    getStages() {
        return readJson(stagesPath);
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
        // Load known stages
        let stages = this.getStages();

        for (let stage of [data.stage_a, data.stage_b]) {
            let stageInfo = stages.find(s => s.id == stage.id);

            // If this is the first time the stage has been available, return some different text
            if (stageInfo && stageInfo.first_available == data.start_time)
                return `New stage ${stage.name} is now open! #splatoon2`;
        }

        return 'Current Splatoon 2 map rotation';
    }
}

module.exports = ScheduleTweet;
