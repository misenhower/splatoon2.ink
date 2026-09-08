import SocialPostBase from './SocialPostBase.js';

export default class NewStagePost extends SocialPostBase {
    getKey() {
        return 'newstage';
    }
    getName() {
        return 'New Stage';
    }

    async getStages() {
        return (await this.readState('stages.json')) ?? [];
    }

    async getData() {
        let time = await this.getDataTime();

        return (await this.getStages()).find(s => s.first_seen == time);
    }

    getImage(data) {
        return this.publicStorage.readBytes(`assets/splatnet${data.image}`);
    }

    async getText(data) {
        let hours = (data.first_available - (await this.getDataTime())) / 60 / 60;
        let duration = hours == 1 ? '1 hour' : `${hours} hours`;

        return `NEW STAGE: The first schedules for ${data.name} have been posted! Start playing the new stage when this post is ${duration} old. #splatoon2`;
    }
}
