import * as settings from './settings';
import * as regions from './regions';
import * as languages from './languages';
import * as data from './data';
import * as schedules from './schedules';
import * as salmonRun from './salmonRun';
import * as splatfests from './splatfests';
import * as splatNetStore from './splatNetStore';
import * as newWeapons from './newWeapons';
import * as finalFest from './finalFest';

let updateNowTimer;

const state = {
    now: null,
};

const getters = {
    now(state) {
        return state.now;
    },
};

const actions = {
    updateNow({ state, commit }) {
        let now = Math.trunc((new Date).getTime() / 1000);

        if (state.now != now)
            commit('UPDATE_NOW', { now });
    },
    setNow({ commit }, { now }) {
        commit('UPDATE_NOW', { now });
    },
    startUpdatingNow({ dispatch }) {
        if (updateNowTimer)
            return;

        dispatch('updateNow');

        updateNowTimer = setInterval(() => {
            dispatch('updateNow');
        }, 200);
    },
    stopUpdatingNow() {
        clearInterval(updateNowTimer);
        updateNowTimer = null;
    },
};

const mutations = {
    UPDATE_NOW(state, { now }) {
        state.now = now;
    },
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
    modules: {
        settings,
        regions,
        languages,
        data,
        schedules,
        salmonRun,
        splatfests,
        splatNetStore,
        newWeapons,
        finalFest,
    },
};
