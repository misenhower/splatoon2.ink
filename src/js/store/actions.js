export default {
    loadLocale({ dispatch }, locale) {
        import(/* webpackChunkName: "lang-[request]" */ `@/locale/${locale}`)
            .then(translations => dispatch('addLocale', { locale, translations }));
    }
}
