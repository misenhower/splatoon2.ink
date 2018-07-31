export default {
    loadLocale({ dispatch }, locale) {
        import(/* webpackChunkName: "lang-[request]" */ `@/web/locale/${locale}`)
            .then(translations => dispatch('addLocale', { locale, translations: translations.default }));
    }
}
