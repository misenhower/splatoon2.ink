require('../common/bootstrap');

module.exports = {
    splatnet: require('./updater').updateAll,
    twitter: require('./twitter').maybePostTweets,
    twitterTest: require('./twitter').testScreenshots,
};

require('make-runnable/custom')({ printOutputFrame: false });
