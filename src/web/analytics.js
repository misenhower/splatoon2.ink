window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;

if (GOOGLE_ANALYTICS_ID) {
    ga('create', GOOGLE_ANALYTICS_ID, 'auto');
    ga('send', 'pageview');
}

export default {
    event() {
        ga('send', 'event', ...arguments);
    },
}
