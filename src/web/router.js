import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        component: require('./components/Main.vue').default,
        children: [
            // Schedules
            {
                path: 'schedules',
                redirect: '/',
            },
            {
                path: 'schedules/regular',
                component: require('./components/splatoon/ScheduleDialog.vue').default,
                props: { mode: 'regular' },
            },
            {
                path: 'schedules/ranked',
                component: require('./components/splatoon/ScheduleDialog.vue').default,
                props: { mode: 'ranked' },
            },
            {
                path: 'schedules/league',
                component: require('./components/splatoon/ScheduleDialog.vue').default,
                props: { mode: 'league' },
            },

            // Splatnet store
            {
                path: 'splatnet',
                component: require('./components/splatoon/SplatNetGearDialog.vue').default,
            },

            // Splatfests
            {
                path: 'splatfests/:region(na|eu|jp)?',
                component: require('./components/splatoon/SplatfestHistoryDialog.vue').default,
                props: true,
            },

            // Other/misc
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
    linkActiveClass: 'is-active',
    routes,
});

export default router;
