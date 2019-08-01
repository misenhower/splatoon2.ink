const TwitterPostBase = require('./TwitterPostBase');
const { captureSalmonRunScreenshot } = require('@/app/screenshots');
const { readData } = require('@/common/utilities');

class SalmonRunTweet extends TwitterPostBase {
    getKey() { return 'salmonrun'; }
    getName() { return 'Salmon Run'; }

    getSalmonRunSchedules() {
        let results = {};
        let coopSchedules = readData('coop-schedules.json');

        for (let schedule of coopSchedules.schedules)
            results[schedule.start_time] = schedule;

        for (let schedule of coopSchedules.details)
            results[schedule.start_time] = schedule;

        return Object.values(results);
    }

    getCurrentSchedule() {
        return this.getSalmonRunSchedules().find(s => s.start_time <= this.getDataTime() && s.end_time > this.getDataTime());
    }

    getJustClosedSchedule() {
        return this.getSalmonRunSchedules().find(s => s.end_time == this.getDataTime());
    }

    getUpcomingSchedule() {
        return this.getSalmonRunSchedules().sort((a, b) => a.start_time - b.start_time)
            .find(s => s.start_time > this.getDataTime());
    }

    getSalmonRunGear() {
        let timeline = readData('timeline.json');

        return timeline.coop && timeline.coop.reward_gear;
    }

    getData() {
        const current = this.getCurrentSchedule();
        const justClosed = this.getJustClosedSchedule();
        const upcoming = this.getUpcomingSchedule();
        const gear = this.getSalmonRunGear();

        // Don't post a tweet if a schedule is not currently active (and one didn't just close),
        if (!current && !justClosed) {
            return null;
        }

        // Only post a tweet when the schedule just started, or periodically every 12 hours
        if (current && (this.getDataTime() - current.start_time) % (12 * 60 * 60) !== 0) {
            return null;
        }

        return { current, justClosed, upcoming, gear };
    }

    getTestData() {
        return {
            current: this.getSalmonRunSchedules()[0],
            justClosed: null,
            upcoming: null,
            gear: this.getSalmonRunGear(),
        };
    }

    getImage(data) {
        let mode = (data.current) ? 'current' : 'upcoming';
        return captureSalmonRunScreenshot(this.getDataTime(), mode);
    }

    getText(data) {
        // A shift just closed and we have an upcoming shift
        if (!data.current && data.upcoming) {
            let hours = (data.upcoming.start_time - this.getDataTime()) / 60 / 60;
            let duration = (hours == 1) ? '1 hour' : `${hours} hours`;

            return `Salmon Run is now closed. The next shift starts in ${duration}! #salmonrun #splatoon2`;
        }

        let gear = '';
        if (data.gear) {
            gear = `Current reward gear is the ${data.gear.gear.name}. `;
        }

        let hasMysteryWeapon = data.current.weapons.some(w => w === null || w.coop_special_weapon);

        let justOpened = data.current.start_time === this.getDataTime();

        let state = (justOpened) ? 'is now open' : 'is still open';
        let hashtags = (justOpened) ? '#salmonrun #splatoon2' : '#salmonrun #ongoingshift #splatoon2';

        if (hasMysteryWeapon)
            return `Salmon Run ${state} on ${data.current.stage.name} with MYSTERY WEAPONS! ${gear}${hashtags}`;

        return `Salmon Run ${state} on ${data.current.stage.name}! ${gear}${hashtags}`;
    }
}

module.exports = SalmonRunTweet;
