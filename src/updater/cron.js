require('./bootstrap');
const CronJob = require('cron').CronJob;
const splatnet = require('./splatnet');
const salmoncalendar = require('./salmoncalendar');

console.info('Starting periodic tasks...');

// Run every hour at 30sec after the hour
new CronJob('30 0 * * * *', () => {
    splatnet.update();
    salmoncalendar.update();
}, null, true);
