export default {
    loadLocale({ dispatch }, locale) {
        // Disabling this for now due to issues with disabling prefetching with the modern build (see vue.config.js)
        // import(/* webpackChunkName: "lang-[request]" */ `@/web/locale/${locale}`)
        //     .then(translations => dispatch('addLocale', { locale, translations: translations.default }));

        dispatch('addLocale', { locale, translations: require(`@/web/locale/${locale}`) });
    }
}
