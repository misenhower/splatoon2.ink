const TwitterPostBase = require('./TwitterPostBase');
const { captureNewWeaponScreenshot } = require('@/app/screenshots');
const { readData } = require('@/common/utilities');

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
        return captureNewWeaponScreenshot(data[0].release_time, data.length);
    }

    getText(data) {
        if (data.length == 1)
            return `NEW WEAPON: The ${data[0].weapon.name} is now available! #splatoon2`;

        // Make sure we don't exceed the max tweet text length
        const names = data.map(availability => `- ${availability.weapon.name}`);
        for (let i = names.length; i > 0; i--) {
            let text = `New weapons now available:\n`;
            text += names.slice(0, i).join('\n');
            text += '\n';
            if (i < names.length) {
                text += 'And more! ';
            }
            text += '#splatoon2';

            if (text.length <= this.getMaxTweetLength()) {
                return text;
            }
        }
    }
}

module.exports = NewWeaponTweet;
