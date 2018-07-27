require('../common/bootstrap');

module.exports = {
    updateGear: require('./updateGear'),
    getSplatNetLanguageFiles: require('./getSplatNetLanguageFiles'),
    copyTranslation: require('./copyTranslation'),
};

require('make-runnable/custom')({ printOutputFrame: false });
