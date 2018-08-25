export const namespaced = true;

function generateModule(name, source) {
    return {
        namespaced: true,
        getters: {
            // All current schedules (active & future)
            currentSchedules(state, getters, { splatoon }) {
                let now = splatoon.now
                let schedules = splatoon.data.schedules;

                if (now && schedules)
                    return schedules[source].filter(s => s.end_time > now);
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
        },
    };
}

export const modules = {
    regular: generateModule('regular', 'regular'),
    ranked: generateModule('ranked', 'gachi'),
    league: generateModule('league', 'league'),
};
