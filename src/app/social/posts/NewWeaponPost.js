import SocialPostBase from './SocialPostBase.js';

export default class NewWeaponPost extends SocialPostBase {
    getKey() { return 'weapon'; }
    getName() { return 'New Weapon'; }

    async getNewWeaponAvailabilities() {
        let weaponAvailability = (await this.readData('timeline.json')).weapon_availability;
        if (weaponAvailability)
            return weaponAvailability.availabilities;
        return [];
    }

    async getData() {
        let time = await this.getDataTime();
        let availabilities = (await this.getNewWeaponAvailabilities()).filter(a => a.release_time == time);

        // Only return the array if it contains availabilities.
        // Otherwise return false (i.e., there's no data, so don't post a Post).
        if (!availabilities.length)
            return false;

        return availabilities;
    }

    async getTestData() {
        let availabilities = await this.getNewWeaponAvailabilities();
        if (availabilities.length)
            return availabilities;
    }

    getImage(data) {
        return this.screenshots.captureNewWeaponScreenshot(data[0].release_time, data.length);
    }

    getText(data) {
        if (data.length == 1)
            return `NEW WEAPON: The ${data[0].weapon.name} is now available! #splatoon2`;

        // Make sure we don't exceed the max post text length
        const names = data.map(availability => `- ${availability.weapon.name}`);
        for (let i = names.length; i > 0; i--) {
            let text = 'New weapons now available:\n';
            text += names.slice(0, i).join('\n');
            text += '\n';
            if (i < names.length) {
                text += 'And more! ';
            }
            text += '#splatoon2';

            if (text.length <= this.getMaxPostLength()) {
                return text;
            }
        }
    }
}
