import Vue from 'vue';
import VuexI18n from 'vuex-i18n';
import store from '../store';

Vue.use(VuexI18n.plugin, store);

Vue.i18n.set('en');
Vue.i18n.fallback('en');
