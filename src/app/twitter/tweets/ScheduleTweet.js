import TwitterPostBase from './TwitterPostBase.js';
import { captureScheduleScreenshot } from '../../screenshots/index.js';
import finalFest from '../../../common/data/finalFest.json' with { type: 'json' };
import shiftyStations from '../../../common/data/shiftyStations.json' with { type: 'json' };

export default class ScheduleTweet extends TwitterPostBase {
    getKey() { return 'schedule'; }
    getName() { return 'Schedule'; }

    getSchedules() {
        return this.readData('schedules.json');
    }

    getStages() {
        return this.readState('stages.json');
    }

    async getData() {
        let schedules = await this.getSchedules();
        let time = await this.getDataTime();
        let regular = schedules.regular.find(s => s.start_time == time);
        let gachi = schedules.gachi.find(s => s.start_time == time);
        let league = schedules.league.find(s => s.start_time == time);

        if (!regular)
            return null;

        return { regular, gachi, league };
    }

    async getTestData() {
        let schedules = await this.getSchedules();
        let regular = schedules.regular[0];
        let gachi = schedules.gachi[0];
        let league = schedules.league[0];
        return { regular, gachi, league };
    }

    async getImage(data) {
        return captureScheduleScreenshot(data.regular.start_time, await this.globalSplatfestOpenInAllRegions());
    }

    getPublicImageFilename() {
        return 'schedule.png';
    }

    async globalSplatfestOpenInAllRegions() {
        let festivals = await this.readData('festivals.json');
        let time = await this.getDataTime();

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

        // Only return the Splatfest if the festival IDs match across all regions
        if (ids[0] === ids[1] && ids[0] === ids[2])
            return festival;
        return false;
    }

    async getText(data) {
        // Load known stages
        let stages = await this.getStages() ?? [];

        for (let stage of [data.regular.stage_a, data.regular.stage_b]) {
            let stageInfo = stages.find(s => s.id == stage.id);

            // If this is the first time the stage has been available, return some different text
            if (stageInfo && stageInfo.first_available == data.regular.start_time)
                return `NEW STAGE: ${stage.name} is now open! #maprotation #splatoon2`;
        }

        let festival = await this.globalSplatfestOpenInAllRegions();

        if (festival) {
            let shiftyText = '';
            let time = await this.getDataTime();
            const finalFestSchedule = finalFest.find(s => s.start_time <= time && s.end_time > time);
            if (finalFestSchedule) {
                const stages = finalFestSchedule.stages
                    .map(id => shiftyStations.find(s => s.id === id))
                    .map(s => s.names.en);

                if (stages.length === 1)
                    shiftyText = `Current Shifty Station is ${stages[0]}. `;
                else
                    shiftyText = `Current Shifty Stations are ${stages[0]} and ${stages[1]}. `;
            }

            return `Join the global Splatfest Battle on ${data.regular.stage_a.name}, ${data.regular.stage_b.name}, and ${festival.special_stage.name}. ${shiftyText} #splatfest #maprotation`;
        }

        return `Splatoon 2 map rotation: Ranked game mode: ${data.gachi.rule.name}, League game mode: ${data.league.rule.name} #maprotation`;
    }
}
