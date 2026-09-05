import '../common/bootstrap.js';
import { CronJob } from 'cron';
import { updateAll } from './updater/index.js';
import { maybePostTweets } from './twitter/index.js';

console.info('Starting periodic tasks...');

// Run every hour at 10sec after the hour
new CronJob('10 0 * * * *', async () => {
    await updateAll();
    await maybePostTweets();
}, null, true);
