import Vue from 'vue';
import VuexI18n from 'vuex-i18n';
import store from '../store';
import shiftyStations from '@/common/data/shiftyStations.json';

Vue.use(VuexI18n.plugin, store);

// Make sure English is always loaded
Vue.i18n.add('en', require('@/web/locale/en'));

Vue.i18n.set('en');
Vue.i18n.fallback('en');

// Shifty Station stage names
for (const stage of shiftyStations) {
  for (const lang in stage.names) {
    Vue.i18n.add(lang, { [`splatnet.stages.${stage.id}.name`]: stage.names[lang] });
  }
}
