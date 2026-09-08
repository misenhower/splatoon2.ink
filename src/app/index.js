import '../common/bootstrap.js';
import { runAction } from '../common/cli.js';
import { updateAll, sendStatuses, testScreenshots } from './node.js';

await runAction({
    splatnet: updateAll,
    social: sendStatuses,
    socialTest: testScreenshots,
}, process.argv.slice(2));
