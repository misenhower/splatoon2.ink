// Entry point for the automated screenshots page

import Vue from 'vue';
import store from './store';

import './i18n';
import './support/directives.js';
import './support/filters.js';

import './assets/css/screenshots.scss';

import VueRouter from 'vue-router';
Vue.use(VueRouter);

import ScreenshotHelper from './components/screenshots/ScreenshotHelper.vue';
import Schedules from './components/screenshots/schedules/Schedules.vue';
import SplatNetGear from './components/screenshots/splatnetgear/SplatNetGear.vue';
import SalmonRun from './components/screenshots/salmonrun/SalmonRun.vue';
import SalmonRunGear from './components/screenshots/salmonrun/SalmonRunGear.vue';
import NewWeapon from './components/screenshots/newweapon/NewWeapon.vue';
import Splatfest from './components/screenshots/splatfest/Splatfest.vue';
const routes = [
    { path: '/', component: ScreenshotHelper },
    { path: '/schedules/:now', component: Schedules },
    { path: '/splatNetGear/:now', component: SplatNetGear },
    { path: '/salmonRun/:now', component: SalmonRun },
    { path: '/salmonRunGear/:now', component: SalmonRunGear },
    { path: '/newWeapon/:now', component: NewWeapon },
    { path: '/splatfest/:region/:now', component: Splatfest, props: true },
];
const router = new VueRouter({ routes });

// Start the Vue app with our root component
import Screenshots from './components/Screenshots.vue';
new Vue({
    render: h => h(Screenshots),
    store,
    router,
}).$mount('#app');
