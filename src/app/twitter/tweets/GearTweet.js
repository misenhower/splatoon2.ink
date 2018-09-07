const TwitterPostBase = require('./TwitterPostBase');
const { captureGearScreenshot } = require('@/app/screenshots');
const { readData, getTopOfCurrentHour } = require('@/common/utilities');

class GearTweet extends TwitterPostBase {
    getKey() { return 'gear'; }
    getName() { return 'Gear'; }

    getMerchandises() {
        return readData('merchandises.json').merchandises;
    }

    getDataTime() {
        // We only have end_times for merchandise items, so we need to track the latest end_time
        let endTimes = this.getMerchandises().map(m => m.end_time);
        let lastEndTime = Math.max(...endTimes);
        return lastEndTime;
    }

    getData() {
        return this.getMerchandises().find(m => m.end_time == this.getDataTime());
    }

    getTestData() {
        let merchandises = this.getMerchandises();
        return merchandises[merchandises.length - 1];
    }

    getImage(data) {
        let now = getTopOfCurrentHour();
        return captureGearScreenshot(now);
    }

    getText(data) {
        return `Up now on SplatNet: ${data.gear.name} with ${data.skill.name} #splatnet2`;
    }
}

module.exports = GearTweet;
