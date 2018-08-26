import { languages, detectSplatoonLanguage } from '@/common/regions.esm';

export const namespaced = true;

export const state = {
    all: languages,
    detectedLanguageKey: detectSplatoonLanguage(),
};

export const getters = {
    selectedKey(state, getters, { splatoon }) {
        let key = splatoon.settings.selectedLanguage;
        return (key === null) ? state.detectedLanguageKey : key;
    },
    selectedLanguage(state, getters) {
        return state.all.find(l => l.language === getters.selectedKey);
    },
};

export const actions = {
    setLanguage({ dispatch }, { language }) {
        let key = (language && language.language) ? language.language : 'en';

        dispatch('splatoon/settings/updateSetting',
            { name: 'selectedLanguage', value: key },
            { root: true });
    },
    languageChanged({ getters, dispatch }) {
        let language = getters.selectedLanguage;
        if (language) {
            dispatch('loadLocale', { locale: language.language });
            dispatch('splatoon/data/updateLanguage', null, { root: true });
            dispatch('i18n/setLocale', { locale: language.language }, { root: true });
        }
    },
    loadLocale({ dispatch }, { locale }) {
        // Disabling this for now due to issues with disabling prefetching with the modern build (see vue.config.js)
        // import(/* webpackChunkName: "lang-[request]" */ `@/web/locale/${locale}`)
        //     .then(translations => dispatch('i18n/addLocale', { locale, translations: translations.default }, { root: true }));

        dispatch('i18n/addLocale', { locale, translations: require(`@/web/locale/${locale}`) }, { root: true });
    },
};
