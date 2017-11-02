// Entry point for the automated screenshots page

import Vue from 'vue';
import './directives.js';
import './filters.js';

import VueRouter from 'vue-router';
Vue.use(VueRouter);

import ScreenshotHelper from './components/screenshots/ScreenshotHelper.vue';
import Schedules from './components/screenshots/schedules/Schedules.vue';
import SplatNetGear from './components/screenshots/splatnetgear/SplatNetGear.vue';
import SalmonRun from './components/screenshots/salmonrun/SalmonRun.vue';
import NewWeapon from './components/screenshots/newweapon/NewWeapon.vue';
import Splatfest from './components/screenshots/splatfest/Splatfest.vue';
const routes = [
    { path: '/', component: ScreenshotHelper },
    { path: '/schedules/:startTime', component: Schedules, props: true },
    { path: '/splatNetGear/:startTime/:endTime', component: SplatNetGear, props: true },
    { path: '/salmonRun/:startTime', component: SalmonRun, props: true },
    { path: '/newWeapon/:releaseTime', component: NewWeapon, props: true },
    { path: '/splatfest/:region/:startTime', component: Splatfest, props: true },
];
const router = new VueRouter({ routes });

// Start the Vue app with our root component
import Screenshots from './components/Screenshots.vue';
new Vue({
    render: h => h(Screenshots),
    router,
}).$mount('#app');

// Start analytics
require('./analytics');
