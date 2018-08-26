let updateDataTimer;

export const namespaced = true;

// State, actions, and mutators are identical for each data source, so this module
// generates them automatically from a list of data sources.

let dataSources = [
    {
        name: 'schedules',
        url: '/data/schedules.json',
    },
    {
        name: 'coop_schedules',
        url: '/data/coop-schedules.json',
    },
    {
        name: 'timeline',
        url: '/data/timeline.json',
    },
    {
        name: 'festivals',
        url: '/data/festivals.json',
    },
    {
        name: 'merchandises',
        url: '/data/merchandises.json',
    },
];

// Automatically determine the update action name and mutation name
for (let source of dataSources) {
    // Action: updateSourceName
    source.actionName = 'update' + source.name[0].toUpperCase() + source.name.substr(1);

    // Mutation: UPDATE_SOURCENAME
    source.mutationName = 'UPDATE_' + source.name.toUpperCase();
}

export const state = { };

export const actions = {
    updateLanguage({ dispatch, rootGetters }) {
        let language = rootGetters['splatoon/languages/selectedLanguage'];
        if (language) {
            fetch(`/data/locale/${language.language}.json`)
                .then(response => response.json())
                .then(data => dispatch('i18n/addLocale', {
                    locale: language.language,
                    translations: { splatnet: data },
                }, { root: true }));
        }
    },
    updateAll({ dispatch }) {
        return Promise.all([
            dispatch('updateLanguage'),
            ...dataSources.map(source => dispatch(source.actionName)),
        ]);
    },
    startUpdatingData({ dispatch }) {
        if (updateDataTimer)
            return;

        dispatch('updateAll');

        let date = new Date;

            // If we're more than 20 seconds past the current hour, schedule the update for the next hour
            if (date.getMinutes() !== 0 || date.getSeconds() >= 20)
                date.setHours(date.getHours() + 1);
            date.setMinutes(0);

            // Random number of seconds past the hour (so all open browsers don't hit the server at the same time)
            let minSec = 25;
            let maxSec = 60;
            date.setSeconds(Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec);

            // Set the timeout
            updateDataTimer = setTimeout(() => {
                updateDataTimer = null;
                dispatch('startUpdatingData');
            }, (date - new Date));
    },
    stopUpdatingData() {
        clearInterval(updateDataTimer);
        updateDataTimer = null;
    },
};

export const mutations = { };

for (let source of dataSources) {
    // State
    state[source.name] = null;

    // Actions
    actions[source.actionName] = async ({ commit }) => {
        fetch(source.url)
            .then(response => response.json())
            .then(data => commit(source.mutationName, { data }));
    };

    // Mutations
    mutations[source.mutationName] = (state, { data }) => {
        state[source.name] = data;
    };
}
