export const namespaced = true;

export const getters = {
    allSplatfests(state, getters, { splatoon }) {
        let now = splatoon.now;
        let data = splatoon.data.festivals;

        if (now && data) {
            let splatfests = { };

            for (let region of ['na', 'eu', 'jp']) {
                let { festivals, results } = data[region];

                for (let festival of festivals) {
                    let state;
                    if (festival.times.start > now)
                        state = 'upcoming';
                    else if (festival.times.end > now)
                        state = 'active';
                    else
                        state = 'past';

                    let regionData = { state, times: festival.times };

                    if (splatfests[festival.festival_id]) {
                        let splatfest = splatfests[festival.festival_id];

                        // Add this region's data
                        splatfest.regions[region] = regionData;

                        // Extend the times (so we get the earliest starting time and the latest ending time)
                        splatfest.times.start = Math.min(splatfest.times.start, regionData.times.start);
                        splatfest.times.end = Math.max(splatfest.times.end, regionData.times.end);

                        continue;
                    }

                    splatfests[festival.festival_id] = {
                        ...festival,
                        times: { ...festival.times }, // Make a copy of the Splatfest times so we can modify them based on other regions
                        regions: { [region]: regionData },
                        results: results.find(r => r.festival_id === festival.festival_id),
                    };
                }
            }

            return Object.values(splatfests)
                .sort((a, b) => b.times.start - a.times.start);
        }
    },

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
            allSplatfests(state, getters, rootState, rootGetters) {
                return rootGetters['splatoon/splatfests/allSplatfests']
                    && rootGetters['splatoon/splatfests/allSplatfests']
                    .filter(s => region in s.regions) // Only show Splatfests for this region
                    .map(s => ({ ...s, ...s.regions[region] })); // Apply this region's data
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
            heroWins(state, getters) {
                if (getters.allSplatfests) {
                    return {
                        alpha: getters.allSplatfests.reduce((sum, festival) => sum + ((festival.results && festival.results.summary.total === 0) ? 1 : 0), 0),
                        bravo: getters.allSplatfests.reduce((sum, festival) => sum + ((festival.results && festival.results.summary.total === 1) ? 1 : 0), 0),
                    }
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
