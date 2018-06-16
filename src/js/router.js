import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        component: require('./components/Main.vue').default,
        children: [
            {
                path: 'about',
                component: require('./components/AboutDialog.vue').default,
            },
            {
                path: 'splatnet',
            },
            {
                path: 'splatfests',
            },
        ],
    },
];

const router = new VueRouter({
    mode: 'history',
    routes,
});

export default router;
