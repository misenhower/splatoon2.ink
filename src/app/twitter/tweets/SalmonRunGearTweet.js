import TwitterPostBase from './TwitterPostBase.js';
import { captureSalmonRunGearScreenshot } from '../../screenshots/index.js';
import moment from 'moment-timezone';

export default class SalmonRunGearTweet extends TwitterPostBase {
    getKey() { return 'salmonrungear'; }
    getName() { return 'Salmon Run Gear'; }

    async getRewardGear() {
        let timeline = await this.readData('timeline.json');
        return timeline.coop && timeline.coop.reward_gear;
    }

    async getData() {
        let rewardGear = await this.getRewardGear();
        if (rewardGear && rewardGear.available_time == await this.getDataTime())
            return rewardGear;
    }

    getTestData() {
        return this.getRewardGear();
    }

    getImage(data, format) {
        return captureSalmonRunGearScreenshot(data.available_time, format);
    }

    getText(data) {
        let monthName = moment.unix(data.available_time).tz('UTC').format('MMMM');
        return `New Salmon Run reward gear has been posted! ${monthName}'s gear is the ${data.gear.name}. #salmonrun #splatoon2`;
    }
}
