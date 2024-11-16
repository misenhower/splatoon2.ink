require('../common/bootstrap');

module.exports = {
    splatnet: require('./updater').updateAll,
    twitter: require('./twitter').maybePostTweets,
    twitterTest: require('./twitter').testScreenshots,
    sync: require('./sync').sync,
    syncUpload: require('./sync').syncUpload,
    syncDownload: require('./sync').syncDownload,
};

require('make-runnable/custom')({ printOutputFrame: false });
