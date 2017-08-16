require('./bootstrap');
const CronJob = require('cron').CronJob;
const update = require('./update');

console.info('Starting periodic tasks...');

// Run every hour at 30sec after the hour
new CronJob('30 0 * * * *', () => {
    update.updateAll();
}, null, true);
