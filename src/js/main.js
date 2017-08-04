import Vue from 'vue';
import App from './components/App.vue';

Vue.directive('portal', {
    inserted(el) {
        document.body.appendChild(el);
    }
});

Vue.filter('date', function(value) {
    return (new Date(value * 1000)).toLocaleDateString([], { month: 'numeric', day: 'numeric' });
});

Vue.filter('time', function(value) {
    return (new Date(value * 1000)).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
});

Vue.filter('duration', function(value) {
    let days = Math.floor(value / 86400);
    value -= days * 86400;
    let hours = Math.floor(value / 3600) % 24;
    value -= hours * 3600;
    let minutes = Math.floor(value / 60) % 60;
    value -= minutes * 60;
    let seconds = value % 60;

    // Add leading zeros
    if (days || hours)
        minutes = ('0' + minutes).substr(-2);
    seconds = ('0' + seconds).substr(-2);

    if (days)
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours)
        return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
});

new Vue(App).$mount('#app');
