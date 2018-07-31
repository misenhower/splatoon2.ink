// This is the same as regions.js but formatted for ES6 modules.
// Temporary fix for importing with vue-cli until I find something that works with nodejs as well.

export const splatoonRegions = [
    { key: null, name: 'Global', demonym: 'Global' },
    { key: 'na', name: 'North America & Oceania', demonym: 'North American & Oceanian' },
    { key: 'eu', name: 'Europe', demonym: 'European' },
    { key: 'jp', name: 'Japan', demonym: 'Japanese' },
];

export const languages = [
    { region: 'NA', language: 'en',    name: 'English' },
    { region: 'EU', language: 'en',    name: 'English (UK)' },
    { region: 'EU', language: 'es',    name: 'Español' },
    { region: 'NA', language: 'es-MX', name: 'Español (MX)' },
    { region: 'EU', language: 'fr',    name: 'Français' },
    { region: 'NA', language: 'fr-CA', name: 'Français (CA)' },
    { region: 'EU', language: 'de',    name: 'Deutsch' },
    { region: 'EU', language: 'nl',    name: 'Nederlands' },
    { region: 'EU', language: 'it',    name: 'Italiano' },
    { region: 'EU', language: 'ru',    name: 'Pусский' },
    { region: 'JP', language: 'ja',    name: '日本語' },
];

export function getRegionByKey(key) {
    return splatoonRegions.find(r => r.key == key);
}

export function detectSplatoonLanguage() {
    let browserLanguages = window.navigator.languages || [window.navigator.language];
    browserLanguages = browserLanguages.map(l => l.toLowerCase());
    let availableLanguages = languages.map(l => l.language.toLowerCase());

    // Try to find a match based on the first part of the available languages (i.e., match "es" for "es-ES")
    for (let language of browserLanguages) {
        for (let availableLanguage of availableLanguages) {
            if (language.startsWith(availableLanguage))
                return availableLanguage;
        }
    }
}

export function detectSplatoonRegion() {
    if (window.navigator && window.navigator.language)
        return detectSplatoonRegionFromLanguage(window.navigator.language);
    return null;
}

function detectSplatoonRegionFromLanguage(language) {
    switch (language) {
        case 'en-US': // USA
        case 'en-CA': // Canada (English)
        case 'fr-CA': // Canada (French)
        case 'es-MX': // Mexico
        case 'en-AU': // Australia
        case 'en-NZ': // New Zealand
            return 'na';

        case 'de-AT': // Austria
        case 'nl-BE': // Belgium (Dutch)
        case 'fr-BE': // Belgium (French)
        case 'cs-CZ': // Czech Republic
        case 'da-DK': // Denmark
        case 'de':    // Germany
        case 'de-DE': // Germany
        case 'es-ES': // Spain
        case 'fi-FI': // Finland
        case 'fr':    // France
        case 'fr-FR': // France
        case 'el-GR': // Greece
        case 'hu-HU': // Hungary
        case 'it-IT': // Italy
        case 'nl':    // Netherlands
        case 'nl-NL': // Netherlands
        case 'nb-NO': // Norway
        case 'pl-PL': // Poland
        case 'pt-PT': // Portugal
        case 'ru-RU': // Russia
        case 'en-ZA': // South Africa
        case 'sv-SE': // Sweden
        case 'de-CH': // Switzerland (German)
        case 'fr-CH': // Switzerland (French)
        case 'it-CH': // Switzerland (Italian)
        case 'en-GB': // United Kingdom
        case 'en-IE': // Ireland
            return 'eu';

        case 'ja':    // Japan
        case 'ja-JP': // Japan
            return 'jp';
    }

    return null;
}
