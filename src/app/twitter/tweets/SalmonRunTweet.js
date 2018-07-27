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
        let hasMysteryWeapon = data.weapons.some(w => w === null || w.coop_special_weapon);

        if (hasMysteryWeapon)
            return `Salmon Run is now open on ${data.stage.name} with MYSTERY WEAPONS! #salmonrun #splatoon2`;

        return `Salmon Run is now open on ${data.stage.name}! #salmonrun #splatoon2`;
    }
}

module.exports = SalmonRunTweet;
