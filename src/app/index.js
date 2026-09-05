import '../common/bootstrap.js';
import { runAction } from '../common/cli.js';
import { updateAll } from './updater/index.js';
import { maybePostTweets, testScreenshots } from './twitter/index.js';
import { sync, syncUpload, syncDownload } from './sync/index.js';

await runAction({
    splatnet: updateAll,
    twitter: maybePostTweets,
    twitterTest: testScreenshots,
    sync,
    syncUpload,
    syncDownload,
}, process.argv.slice(2));
