import store from '@/web/store';

export const namespaced = true;

const settings = [
    {
        name: 'selectedRegion',
        key: 'selected-region',
    },
    {
        name: 'selectedLanguage',
        key: 'selected-language',
        action: 'splatoon/languages/languageChanged',
    },
];

function reloadSettings() {
    for (let setting of settings)
        store.dispatch('splatoon/settings/loadSetting', { name: setting.name });
}

export const state = {};

export const actions = {
    initialize({ dispatch }) {
        window.addEventListener('storage', reloadSettings);

        for (let setting of settings)
            dispatch('loadSetting', { name: setting.name });
    },
    shutdown() {
        window.removeEventListener('storage', reloadSettings);
    },
    loadSetting({ commit, dispatch }, { name }) {
        let setting = settings.find(s => s.name === name);

        if (setting) {
            let value = localStorage.getItem(setting.key);
            commit('UPDATE_SETTING', { name, value });

            if (setting.action)
                dispatch(setting.action, null, { root: true });
        }
    },
    updateSetting({ commit, dispatch }, { name, value }) {
        let setting = settings.find(s => s.name === name);

        if (setting) {
            localStorage.setItem(setting.key, value);
            commit('UPDATE_SETTING', { name, value });

            if (setting.action)
                dispatch(setting.action, null, { root: true });
        }
    },
};

export const mutations = {
    UPDATE_SETTING(store, { name, value }) {
        store[name] = value;
    },
};

for (let setting of settings) {
    state[setting.name] = null;
}
