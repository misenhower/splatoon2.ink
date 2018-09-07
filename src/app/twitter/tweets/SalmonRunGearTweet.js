const TwitterPostBase = require('./TwitterPostBase');
const { captureSalmonRunGearScreenshot } = require('@/app/screenshots');
const { readData } = require('@/common/utilities');
const moment = require('moment-timezone');

class SalmonRunTweet extends TwitterPostBase {
    getKey() { return 'salmonrungear'; }
    getName() { return 'Salmon Run Gear'; }

    getRewardGear() {
        let timeline = readData('timeline.json');
        return timeline.coop && timeline.coop.reward_gear;
    }

    getData() {
        let rewardGear = this.getRewardGear();
        if (rewardGear.available_time == this.getDataTime())
            return rewardGear;
    }

    getTestData() {
        return this.getRewardGear();
    }

    getImage(data) {
        return captureSalmonRunGearScreenshot(data.available_time);
    }

    getText(data) {
        let monthName = moment.unix(data.available_time).tz('UTC').format('MMMM');
        return `New Salmon Run reward gear has been posted! ${monthName}'s gear is the ${data.gear.name}. #salmonrun #splatoon2`;
    }
}

module.exports = SalmonRunTweet;
