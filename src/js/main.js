import Vue from 'vue';
import App from './components/App.vue';

Vue.directive('portal', {
    inserted(el) {
        document.body.appendChild(el);
    }
});

new Vue(App).$mount('#app');
