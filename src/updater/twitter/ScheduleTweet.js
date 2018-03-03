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
        let regular = this.getSchedules().regular.find(s => s.start_time == this.getDataTime());
        let gachi = this.getSchedules().gachi.find(s => s.start_time == this.getDataTime());
        let league = this.getSchedules().league.find(s => s.start_time == this.getDataTime());

        if (!regular)
            return null;

        return { regular, gachi, league };
    }

    getTestData() {
        let regular = this.getSchedules().regular[0];
        let gachi = this.getSchedules().gachi[0];
        let league = this.getSchedules().league[0];
        return { regular, gachi, league };
    }

    getImage(data) {
        return captureScheduleScreenshot(data.regular.start_time);
    }

    getText(data) {
        // Load known stages
        let stages = this.getStages();

        for (let stage of [data.regular.stage_a, data.regular.stage_b]) {
            let stageInfo = stages.find(s => s.id == stage.id);

            // If this is the first time the stage has been available, return some different text
            if (stageInfo && stageInfo.first_available == data.regular.start_time)
                return `NEW STAGE: ${stage.name} is now open! #maprotation #splatoon2`;
        }

        return `Splatoon 2 map rotation: Ranked game mode: ${data.gachi.rule.name}, League game mode: ${data.league.rule.name} #maprotation`;
    }
}

module.exports = ScheduleTweet;
