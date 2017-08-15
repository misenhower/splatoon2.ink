import Vue from 'vue';

// Short date format (e.g., 8/15 or 15/8)
Vue.filter('date', function(value) {
    return (new Date(value * 1000)).toLocaleDateString([], { month: 'numeric', day: 'numeric' });
});

// Short localized time format (e.g., 1:23 PM or 13:23)
Vue.filter('time', function(value) {
    return (new Date(value * 1000)).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
});

// Countdown duration (e.g., 1d 13h 21m 19s)
Vue.filter('duration', function(value) {
    let negative = (value < 0) ? '-' : '';
    value = Math.abs(value);

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
        return `${negative}${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours)
        return `${negative}${hours}h ${minutes}m ${seconds}s`;
    return `${negative}${minutes}m ${seconds}s`;
});
