import TwitterPostBase from './TwitterPostBase.js';
import { captureSalmonRunGearScreenshot } from '../../screenshots/index.js';
import { readData } from '../../../common/utilities.js';
import moment from 'moment-timezone';

export default class SalmonRunGearTweet extends TwitterPostBase {
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
