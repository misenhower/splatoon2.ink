import Vue from 'vue';
const $t = Vue.i18n.translate;
const currentLocale = Vue.i18n.locale;

// Local hosting of SplatNet images
Vue.filter('localSplatNetImageUrl', function(value) {
    // Have to use a relative path here for the screenshot generator.
    // May need to change this in the future.
    return 'assets/splatnet' + value;
});

Vue.filter('numberFormat', function(value) {
    if (value)
        return value.toLocaleString([currentLocale()]);
});

// Short date format (e.g., 8/15 or 15/8)
Vue.filter('date', function(value, options = undefined) {
    return (new Date(value * 1000)).toLocaleDateString([currentLocale()], Object.assign({ month: 'numeric', day: 'numeric' }, options));
});

// Short localized time format (e.g., 1:23 PM or 13:23)
Vue.filter('time', function(value) {
    return (new Date(value * 1000)).toLocaleTimeString([currentLocale()], { hour: 'numeric', minute: '2-digit' });
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

    // Format for translation
    days = days && $t('time.daysShort', { days }, parseInt(days));
    hours = hours && $t('time.hoursShort', { hours }, parseInt(hours));
    minutes = $t('time.minutesShort', { minutes }, parseInt(minutes));
    seconds = $t('time.secondsShort', { seconds }, parseInt(seconds));

    if (days)
        return negative + $t((hideSeconds) ? 'time.dhm' : 'time.dhms', { days, hours, minutes, seconds });
    if (hours)
        return negative + $t((hideSeconds) ? 'time.hm' : 'time.hms', { hours, minutes, seconds });
    return negative + $t('time.ms', { minutes, seconds });
});

Vue.filter('shortDuration', function (value) {
    let { negative, days, hours, minutes, seconds } = getDurationParts(value);

    if (days)
        return $t('time.days', { days: negative + days }, days);
    if (hours)
        return $t('time.hours', { hours: negative + hours }, hours);
    if (minutes)
        return $t('time.minutes', { minutes: negative + minutes }, minutes);
    return $t('time.seconds', { seconds: negative + seconds }, seconds);
});

Vue.filter('durationHours', function (value) {
    let { negative, days, hours, minutes, seconds } = getDurationParts(value);

    hours += 24 * days;
    return $t('time.hours', { hours: negative + hours }, hours);
});

Vue.filter('time.in', function(time) {
    return $t('time.in', { time });
});

Vue.filter('time.remaining', function (time) {
    return $t('time.remaining', { time });
});
