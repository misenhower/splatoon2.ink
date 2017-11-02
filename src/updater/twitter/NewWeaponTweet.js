const TwitterPostBase = require('./TwitterPostBase');
const { captureNewWeaponScreenshot } = require('../screenshots');
const { readData } = require('./utilities');

class NewWeaponTweet extends TwitterPostBase {
    getKey() { return 'weapon'; }
    getName() { return 'New Weapon'; }

    getNewWeaponAvailabilities() {
        let weaponAvailability = readData('timeline.json').weapon_availability;
        if (weaponAvailability)
            return weaponAvailability.availabilities;
        return [];
    }

    getData() {
        let availabilities = this.getNewWeaponAvailabilities().filter(a => a.release_time == this.getDataTime());

        // Only return the array if it contains availabilities.
        // Otherwise return false (i.e., there's no data, so don't post a Tweet).
        if (!availabilities.length)
            return false;

        return availabilities;
    }

    getTestData() {
        let availabilities = this.getNewWeaponAvailabilities()
        if (availabilities.length)
            return availabilities;
    }

    getImage(data) {
        return captureNewWeaponScreenshot(data[0].release_time);
    }

    getText(data) {
        if (data.length == 1)
            return `New weapon now available: ${data[0].weapon.name} #splatoon2`;

        let text = `New weapons now available:`;
        for (let availability of data)
            text += `\n- ${availability.weapon.name}`;
        text += '\n#splatoon2';

        return text;
    }
}

module.exports = NewWeaponTweet;
