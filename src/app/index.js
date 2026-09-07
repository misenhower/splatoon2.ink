import '../common/bootstrap.js';
import { runAction } from '../common/cli.js';
import { updateAllLocally, postLocally, testScreenshotsLocally } from './local.js';

await runAction({
    splatnet: updateAllLocally,
    twitter: postLocally,
    twitterTest: testScreenshotsLocally,
}, process.argv.slice(2));
