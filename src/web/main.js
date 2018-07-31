import Vue from 'vue';
import store from './store';
import router from './router';

import './i18n';
import './support/directives.js';
import './support/filters.js';

import './assets/css/main.scss';

// Start the Vue app with our root component
import App from './components/App.vue';
new Vue({
    render: h => h(App),
    store,
    router,
}).$mount('#app');
