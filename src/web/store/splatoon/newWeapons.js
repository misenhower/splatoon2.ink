export const namespaced = true;

export const getters = {
    availabilities(state, getters, { splatoon }) {
        let now = splatoon.now;
        let availabilities = splatoon.data.timeline
            && splatoon.data.timeline.weapon_availability
            && splatoon.data.timeline.weapon_availability.availabilities;

        if (now && availabilities)
            return availabilities.filter(a => a.release_time <= now);
    },
    weapons(state, getters) {
        return getters.availabilities
            && getters.availabilities.map(a => a.weapon);
    },
};
