const TwitterPostBase = require('./TwitterPostBase');
const { captureSalmonRunScreenshot } = require('@/app/screenshots');
const { readData } = require('@/common/utilities');

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

    getSalmonRunGear() {
        let timeline = readData('timeline.json');

        return timeline.coop && timeline.coop.reward_gear;
    }

    getData() {
        const schedule = this.getSalmonRunSchedules().find(s => s.start_time == this.getDataTime());
        const gear = this.getSalmonRunGear();

        return { schedule, gear };
    }

    getTestData() {
        const schedule = this.getSalmonRunSchedules()[0];
        const gear = this.getSalmonRunGear();

        return { schedule, gear };
    }

    getImage(data) {
        return captureSalmonRunScreenshot(data.schedule.start_time);
    }

    getText(data) {
        let gear = '';
        if (data.gear) {
            gear = `Current reward gear is the ${data.gear.gear.name}. `;
        }

        let hasMysteryWeapon = data.schedule.weapons.some(w => w === null || w.coop_special_weapon);

        if (hasMysteryWeapon)
            return `Salmon Run is now open on ${data.schedule.stage.name} with MYSTERY WEAPONS! ${gear} #salmonrun #splatoon2`;

        return `Salmon Run is now open on ${data.schedule.stage.name}! ${gear} #salmonrun #splatoon2`;
    }
}

module.exports = SalmonRunTweet;
