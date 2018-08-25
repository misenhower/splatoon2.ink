import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        component: require('./components/Main.vue').default,
        children: [
            {
                path: 'splatnet',
                component: require('./components/splatoon/SplatNetGearDialog.vue').default,
            },
            {
                path: 'splatfests',
                component: require('./components/splatoon/SplatfestHistoryDialog.vue').default,
            },
            {
                path: 'about',
                component: require('./components/AboutDialog.vue').default,
            },
            {
                path: 'calendars',
                component: require('./components/CalendarDialog.vue').default,
            },
        ],
    },
    {
        path: '*',
        component: require('./components/404.vue').default,
    },
];

const router = new VueRouter({
    mode: 'history',
    routes,
});

export default router;
