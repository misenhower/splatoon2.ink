const TwitterPostBase = require('./TwitterPostBase');
const { readJson } = require('@/common/utilities');
const path = require('path');
const fs = require('fs');

const stagesPath = path.resolve('storage/stages.json');
const splatnetAssetPath = path.resolve('dist/assets/splatnet');

class NewStageTweet extends TwitterPostBase {
    getKey() { return 'newstage'; }
    getName() { return 'New Stage'; }

    getStages() {
        return readJson(stagesPath);
    }

    getData() {
        return this.getStages().find(s => s.first_seen == this.getDataTime());
    }

    getImage(data) {
        return fs.readFileSync(splatnetAssetPath + data.image);
    }

    getText(data) {
        let hours = (data.first_available - this.getDataTime()) / 60 / 60;
        let duration = (hours == 1) ? '1 hour' : `${hours} hours`;
        return `NEW STAGE: The first schedules for ${data.name} have been posted! Start playing the new stage when this tweet is ${duration} old. #splatoon2`;
    }
}

module.exports = NewStageTweet;
