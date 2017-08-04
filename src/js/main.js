import Vue from 'vue';
import App from './components/App.vue';
import moment from 'moment';

Vue.directive('portal', {
    inserted(el) {
        document.body.appendChild(el);
    }
});

Vue.filter('time', function(value) {
    return moment.unix(value).local().format('ha');
});

Vue.filter('duration', function(value) {
    let duration = moment.duration(value, 'seconds');
    let hours = Math.floor(duration.asHours());
    let minutes = ('0' + duration.minutes()).substr(-2);
    let seconds = ('0' + duration.seconds()).substr(-2);
    if (hours)
        return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
});

new Vue(App).$mount('#app');
