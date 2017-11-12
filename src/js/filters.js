import Vue from 'vue';

// Local hosting of SplatNet images
Vue.filter('localSplatNetImageUrl', function(value) {
    // Have to use a relative path here for the screenshot generator.
    // May need to change this in the future.
    return 'assets/splatnet' + value;
});

// Short date format (e.g., 8/15 or 15/8)
Vue.filter('date', function(value, options = undefined) {
    return (new Date(value * 1000)).toLocaleDateString([], Object.assign({ month: 'numeric', day: 'numeric' }, options));
});

// Short localized time format (e.g., 1:23 PM or 13:23)
Vue.filter('time', function(value) {
    return (new Date(value * 1000)).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
});

function getDurationParts(value) {
    let negative = (value < 0) ? '-' : '';
    value = Math.abs(value);

    let days = Math.floor(value / 86400);
    value -= days * 86400;
    let hours = Math.floor(value / 3600) % 24;
    value -= hours * 3600;
    let minutes = Math.floor(value / 60) % 60;
    value -= minutes * 60;
    let seconds = value % 60;

    return { negative, days, hours, minutes, seconds };
}

// Countdown duration (e.g., 1d 13h 21m 19s)
// "hideSeconds" only hides seconds when the time is >= 1 hour, this is used in the Salmon Run box
Vue.filter('duration', function(value, hideSeconds = false) {
    let { negative, days, hours, minutes, seconds } = getDurationParts(value);

    // Add leading zeros
    if (days || hours)
        minutes = ('0' + minutes).substr(-2);
    seconds = ('0' + seconds).substr(-2);

    if (days) {
        if (hideSeconds)
            return `${negative}${days}d ${hours}h ${minutes}m`;
        return `${negative}${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    if (hours) {
        if (hideSeconds)
            return `${negative}${hours}h ${minutes}m`;
        return `${negative}${hours}h ${minutes}m ${seconds}s`;
    }
    return `${negative}${minutes}m ${seconds}s`;
});

Vue.filter('shortDuration', function (value) {
    let { negative, days, hours, minutes, seconds } = getDurationParts(value);

    if (days)
        return (days == 1) ? `${negative}1 day` : `${negative}${days} days`;
    if (hours)
        return (hours == 1) ? `${negative}1 hour` : `${negative}${hours} hours`;
    if (minutes)
        return (minutes == 1) ? `${negative}1 minute` : `${negative}${minutes} minutes`;
    return (seconds == 1) ? `${negative}1 second` : `${negative}${seconds} seconds`;
});

Vue.filter('durationHours', function (value) {
    let { negative, days, hours, minutes, seconds } = getDurationParts(value);

    hours += 24 * days;
    return (hours == 1) ? `${negative}1 hour` : `${negative}${hours} hours`;
});
