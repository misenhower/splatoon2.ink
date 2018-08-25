import { splatoonRegions, detectSplatoonRegion } from '@/common/regions.esm';

export const namespaced = true;

export const state = {
    all: splatoonRegions,
    detectedRegionKey: detectSplatoonRegion(),
};

export const getters = {
    all(state) {
        return state.all;
    },
    selectedKey(state, getters, { splatoon }) {
        let key = splatoon.settings.selectedRegion;
        return (key === null) ? state.detectedRegionKey : key;
    },
    selectedRegion(state, getters) {
        return state.all.find(r => r.key === getters.selectedKey);
    },
};

export const actions = {
    setRegion({ dispatch }, { region }) {
        let key = (region && region.key) ? region.key : 'global';

        dispatch('splatoon/settings/updateSetting',
            { name: 'selectedRegion', value: key },
            { root: true });
    },
};
