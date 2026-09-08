import '../common/bootstrap.js';
import { CronJob } from 'cron';
import { updateAll, sendStatuses } from './node.js';

console.info('Starting periodic tasks...');

// Run every hour at 10sec after the hour
new CronJob('10 0 * * * *', async () => {
    try {
        await updateAll();
        await sendStatuses();
    } catch (error) {
        console.error(error);
    }
}, null, true);
