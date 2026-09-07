import '../common/bootstrap.js';
import { CronJob } from 'cron';
import { updateAllLocally, postLocally } from './local.js';

console.info('Starting periodic tasks...');

// Run every hour at 10sec after the hour
new CronJob('10 0 * * * *', async () => {
    try {
        await updateAllLocally();
        await postLocally();
    } catch (error) {
        console.error(error);
    }
}, null, true);
