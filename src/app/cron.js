require('../common/bootstrap');
const CronJob = require('cron').CronJob;
const updater = require('./updater');
const twitter = require('./twitter');

console.info('Starting periodic tasks...');

// Run every hour at 10sec after the hour
new CronJob('10 0 * * * *', async () => {
    await updater.updateAll();
    await twitter.maybePostTweets();
}, null, true);
