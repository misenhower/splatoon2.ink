export const namespaced = true;

export const getters = {
    anyRegionHasCurrentSplatfest(state, getters, rootState, rootGetters) {
        return rootGetters['splatoon/splatfests/na/currentSplatfest']
            || rootGetters['splatoon/splatfests/eu/currentSplatfest']
            || rootGetters['splatoon/splatfests/jp/currentSplatfest'];
    },
    selectedRegionCurrentSplatfest(state, getters, rootState, rootGetters) {
        let region = rootGetters[`splatoon/regions/selectedRegion`];
        if (region)
            return rootGetters[`splatoon/splatfests/${region.key}/currentSplatfest`];
    },
    selectedRegionHasActiveSplatfest(state, getters) {
        return getters.selectedRegionCurrentSplatfest
            && getters.selectedRegionCurrentSplatfest.state === 'active';
    },
};

function generateModule(region) {
    return {
        namespaced: true,
        getters: {
            allSplatfests(state, getters, { splatoon }) {
                let now = splatoon.now;
                let data = splatoon.data.festivals && splatoon.data.festivals[region];

                if (now && data) {
                    let { festivals, results } = data;

                    return festivals.map(festival => {
                        let state;
                        if (festival.times.start > now)
                            state = 'upcoming';
                        else if (festival.times.end > now)
                            state = 'active';
                        else
                            state = 'past';

                        return {
                            ...festival,
                            state,
                            results: results.find(r => r.festival_id === festival.festival_id),
                        };
                    });
                }
            },
            currentSplatfest(state, getters, { splatoon }) {
                let now = splatoon.now;

                if (now && getters.allSplatfests) {
                    // We want to show future/current festivals and festivals that ended recently (so we can show their results).
                    // Filter based on the result time and show festival results for a few days.
                    let cutoff = now - 86400 * 3; // 3 days
                    return getters.allSplatfests.find(s => s.times.result > cutoff);
                }
            },
        },
    };
}

export const modules = {
    na: generateModule('na'),
    eu: generateModule('eu'),
    jp: generateModule('jp'),
}
