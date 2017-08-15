import Vue from 'vue';
import './directives.js';
import './filters.js';

// Start the Vue app with our root component
import App from './components/App.vue';
new Vue(App).$mount('#app');
