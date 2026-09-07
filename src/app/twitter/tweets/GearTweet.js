import TwitterPostBase from './TwitterPostBase.js';
import { captureGearScreenshot } from '../../screenshots/index.js';
import { getTopOfCurrentHour } from '../../../common/time.js';

export default class GearTweet extends TwitterPostBase {
    getKey() { return 'gear'; }
    getName() { return 'Gear'; }

    async getMerchandises() {
        return (await this.readData('merchandises.json')).merchandises;
    }

    async getDataTime() {
        // We only have end_times for merchandise items, so we need to track the latest end_time
        let endTimes = (await this.getMerchandises()).map(m => m.end_time);
        let lastEndTime = Math.max(...endTimes);
        return lastEndTime;
    }

    async getData() {
        let time = await this.getDataTime();
        return (await this.getMerchandises()).find(m => m.end_time == time);
    }

    async getTestData() {
        let merchandises = await this.getMerchandises();
        return merchandises[merchandises.length - 1];
    }

    getImage(data) {
        let now = getTopOfCurrentHour();
        return captureGearScreenshot(now);
    }

    getPublicImageFilename() {
        return 'gear.png';
    }

    getText(data) {
        return `Up now on SplatNet: ${data.gear.name} with ${data.skill.name} #splatnet2`;
    }
}
