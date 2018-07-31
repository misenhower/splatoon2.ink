export default {
    event(category, action, label = undefined) {
        if (window.gtag) {
            window.gtag('event', {
                event_category: category,
                event_action: action,
                event_label: label,
            });
        }
    },
};
