import { nextDataRefreshAt } from '../../../common/dataRefresh.js';

let updateDataTimer;
let updatingData = false;
let refreshGeneration = 0;

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
            return fetchJson(`/data/locale/${language.language}.json`)
                .then(data => dispatch('i18n/addLocale', {
                    locale: language.language,
                    translations: { splatnet: data },
                }, { root: true }));
        }
    },
    updateAll({ dispatch }) {
        return Promise.allSettled([
            dispatch('updateLanguage'),
            ...dataSources.map(source => dispatch(source.actionName)),
        ]);
    },
    startUpdatingData({ dispatch }) {
        if (updatingData)
            return;
        updatingData = true;
        let generation = ++refreshGeneration;

        async function refresh() {
            try {
                await dispatch('updateAll');
            } catch (error) {
                console.error('Could not refresh site data', error);
            } finally {
                if (updatingData && generation === refreshGeneration)
                    updateDataTimer = setTimeout(refresh, nextDataRefreshAt() - Date.now());
            }
        }
        return refresh();
    },
    stopUpdatingData() {
        updatingData = false;
        clearTimeout(updateDataTimer);
        updateDataTimer = null;
    },
};

export const mutations = { };

for (let source of dataSources) {
    // State
    state[source.name] = null;

    // Actions
    actions[source.actionName] = async ({ commit }) => {
        return fetchJson(source.url)
            .then(data => commit(source.mutationName, { data }));
    };

    // Mutations
    mutations[source.mutationName] = (state, { data }) => {
        state[source.name] = data;
    };
}

async function fetchJson(url) {
    // Use AbortController rather than newer AbortSignal helpers in the older frontend.
    // Keep the deadline active through body parsing so a stalled response cannot stop polling.
    let controller = new AbortController;
    let timeout = setTimeout(() => controller.abort(), 30_000);
    try {
        let response = await fetch(url, { signal: controller.signal });
        if (!response.ok)
            throw new Error(`Data request failed: ${response.status}`);
        return await response.json();
    } finally {
        clearTimeout(timeout);
    }
}
