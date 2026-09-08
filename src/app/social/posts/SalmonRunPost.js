import SocialPostBase from './SocialPostBase.js';

const PREVIOUS_SCHEDULE_KEY = 'salmonrun-previousSchedule.json';

export default class SalmonRunPost extends SocialPostBase {
    getKey() { return 'salmonrun'; }
    getName() { return 'Salmon Run'; }

    async getSalmonRunSchedules() {
        let results = {};
        let coopSchedules = await this.readData('coop-schedules.json');

        for (let schedule of coopSchedules.schedules)
            results[schedule.start_time] = schedule;

        for (let schedule of coopSchedules.details)
            results[schedule.start_time] = schedule;

        return Object.values(results);
    }

    async getCurrentSchedule() {
        let time = await this.getDataTime();
        return (await this.getSalmonRunSchedules()).find(s => s.start_time <= time && s.end_time > time);
    }

    async getUpcomingSchedule() {
        let time = await this.getDataTime();
        return (await this.getSalmonRunSchedules()).sort((a, b) => a.start_time - b.start_time)
            .find(s => s.start_time > time);
    }

    async getSalmonRunGear() {
        let timeline = await this.readData('timeline.json');

        return timeline.coop && timeline.coop.reward_gear;
    }

    async getData() {
        const time = await this.getDataTime();
        const current = await this.getCurrentSchedule();
        const previous = await this.getPreviousSchedule();
        const upcoming = await this.getUpcomingSchedule();
        const gear = await this.getSalmonRunGear();

        const result = { current, previous, upcoming, gear };

        // If a shift is currently open, cache it for later so we can know when it ends
        if (current) {
            await this.updatePreviousSchedule(current);
        }

        // Post a post if a schedule just started, or periodically every 12 hours
        if (current && (time - current.start_time) % (12 * 60 * 60) === 0) {
            return result;
        }

        // Post a post if the previous schedule just closed
        if (previous && previous.end_time === time) {
            return result;
        }

        // Otherwise, don't post a post
        return null;
    }

    async getTestData() {
        return {
            current: (await this.getSalmonRunSchedules())[0],
            upcoming: null,
            gear: await this.getSalmonRunGear(),
        };
    }

    async getPreviousSchedule() {
        return await this.readState(PREVIOUS_SCHEDULE_KEY) ?? undefined;
    }

    updatePreviousSchedule(schedule) {
        return this.writeState(PREVIOUS_SCHEDULE_KEY, schedule);
    }

    async getImage(data) {
        let mode = (data.current) ? 'current' : 'upcoming';
        return this.screenshots.captureSalmonRunScreenshot(await this.getDataTime(), mode);
    }

    async getText(data) {
        let time = await this.getDataTime();

        // A shift just closed and we have an upcoming shift
        if (!data.current && data.upcoming) {
            let hours = (data.upcoming.start_time - time) / 60 / 60;
            let duration = (hours == 1) ? '1 hour' : `${hours} hours`;

            return `Salmon Run is now closed. The next shift starts in ${duration}! #salmonrun #splatoon2`;
        }

        let gear = '';
        if (data.gear) {
            gear = `Current reward gear is the ${data.gear.gear.name}. `;
        }

        let hasMysteryWeapon = data.current.weapons.some(w => w === null || w.coop_special_weapon);
        let hasGrizzcoMysteryWeapon = data.current.weapons.some(w => w && w.coop_special_weapon && w.id === '-2');

        let justOpened = data.current.start_time === time;

        let state = (justOpened) ? 'is now open' : 'is still open';
        let hashtags = (justOpened) ? '#salmonrun #splatoon2' : '#salmonrun #ongoingshift #splatoon2';

        if (hasGrizzcoMysteryWeapon)
            return `Salmon Run ${state} on ${data.current.stage.name} with GRIZZCO MYSTERY WEAPONS! ${gear}${hashtags}`;

        if (hasMysteryWeapon)
            return `Salmon Run ${state} on ${data.current.stage.name} with MYSTERY WEAPONS! ${gear}${hashtags}`;

        return `Salmon Run ${state} on ${data.current.stage.name}! ${gear}${hashtags}`;
    }
}
