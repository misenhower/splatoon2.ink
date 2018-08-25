export const namespaced = true;

export const getters = {
    // All current schedules (active & future)
    currentSchedules(state, getters, { splatoon }) {
        let now = splatoon.now;
        let coopSchedules = splatoon.data.coop_schedules;

        if (now && coopSchedules) {
            let { schedules, details } = coopSchedules;

            return schedules.map(schedule => {
                let detail = details.find(d => d.start_time == schedule.start_time);
                return detail || schedule;
            }).filter(s => s.end_time > now);
        }
    },
    // The currently-active schedule
    activeSchedule(state, getters, { splatoon }) {
        let now = splatoon.now;

        if (now && getters.currentSchedules)
            return getters.currentSchedules.find(s => s.start_time <= now);
    },
    // Future upcoming schedules
    upcomingSchedules(state, getters, { splatoon }) {
        let now = splatoon.now;

        if (now && getters.currentSchedules)
            return getters.currentSchedules.filter(s => s.start_time > now);
    },
    rewardGear(state, getters, { splatoon }) {
        return splatoon.data.timeline
            && splatoon.data.timeline.coop
            && splatoon.data.timeline.coop.reward_gear
            && splatoon.data.timeline.coop.reward_gear.gear;
    },
};
