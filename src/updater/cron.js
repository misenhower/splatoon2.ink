require('./bootstrap');
const CronJob = require('cron').CronJob;
const update = require('./update');
const twitter = require('./twitter');

console.info('Starting periodic tasks...');

// Run every hour at 30sec after the hour
new CronJob('30 0 * * * *', async () => {
    await update.updateAll();
    await twitter.maybePostTweets();
}, null, true);
