const splatoonRegions = [
    { key: null, name: 'Global', demonym: 'Global' },
    { key: 'na', name: 'North America & Oceania', demonym: 'North American & Oceanian' },
    { key: 'eu', name: 'Europe', demonym: 'European' },
    { key: 'jp', name: 'Japan', demonym: 'Japanese' },
];

function getRegionByKey(key) {
    return splatoonRegions.find(r => r.key == key);
}

function detectSplatoonRegion() {
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

module.exports = {
    splatoonRegions,
    getRegionByKey,
    detectSplatoonRegion,
}
