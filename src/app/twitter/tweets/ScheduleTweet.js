const TwitterPostBase = require('./TwitterPostBase');
const { captureScheduleScreenshot } = require('@/app/screenshots');
const { readData, readJson } = require('@/common/utilities');
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
        return captureScheduleScreenshot(data.regular.start_time, this.globalSplatfestOpenInAllRegions());
    }

    getPublicImageFilename(data) {
        return 'schedule.png';
    }

    globalSplatfestOpenInAllRegions() {
        let festivals = readData('festivals.json');
        let time = this.getDataTime();

        let festival;
        let ids = [];

        // Is there an open Splatfest in each region?
        // (Checking NA last so we can return that one more easily)
        for (let region of ['eu', 'jp', 'na']) {
            festival = festivals[region].festivals.find(f => f.times.start <= time && f.times.end > time);
            if (!festival)
                return false;
            ids.push(festival.festival_id);
        }

        console.log(ids);

        // Only return the Splatfest if the festival IDs match across all regions
        if (ids[0] === ids[1] && ids[0] === ids[2])
            return festival;
        return false;
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

        let festival = this.globalSplatfestOpenInAllRegions();

        if (festival)
            return `The global Splatfest is open in all regions! Join the Splatfest Battle on ${data.regular.stage_a.name}, ${data.regular.stage_b.name}, and ${festival.special_stage.name}. #splatfest #maprotation`;

        return `Splatoon 2 map rotation: Ranked game mode: ${data.gachi.rule.name}, League game mode: ${data.league.rule.name} #maprotation`;
    }
}

module.exports = ScheduleTweet;
