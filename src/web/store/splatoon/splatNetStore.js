export const namespaced = true;

export const getters = {
    merchandises(state, getters, { splatoon }) {
        let now = splatoon.now;
        let merchandises = splatoon.data.merchandises && splatoon.data.merchandises.merchandises;

        if (now && merchandises)
            return merchandises.filter(m => m.end_time > now);
    },
};
