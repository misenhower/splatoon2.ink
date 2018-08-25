import Vue from 'vue';
import Vuex from 'vuex';

import splatoon from './splatoon';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
    modules: {
        splatoon,
    },
    strict: debug,
});
