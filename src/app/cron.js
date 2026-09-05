import '../common/bootstrap.js';
import { CronJob } from 'cron';
import { updateAllLocally } from './local.js';
import { maybePostTweets } from './twitter/index.js';

console.info('Starting periodic tasks...');

// Run every hour at 10sec after the hour
new CronJob('10 0 * * * *', async () => {
    await updateAllLocally();
    await maybePostTweets();
}, null, true);
