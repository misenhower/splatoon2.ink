import '../common/bootstrap.js';
import { runAction } from '../common/cli.js';
import { updateAllLocally, postLocally, testScreenshotsLocally } from './local.js';

await runAction({
    splatnet: updateAllLocally,
    social: postLocally,
    socialTest: testScreenshotsLocally,
}, process.argv.slice(2));
