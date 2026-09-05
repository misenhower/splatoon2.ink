import '../common/bootstrap.js';
import { runAction } from '../common/cli.js';
import { updateAllLocally } from './local.js';
import { maybePostTweets, testScreenshots } from './twitter/index.js';

await runAction({
    splatnet: updateAllLocally,
    twitter: maybePostTweets,
    twitterTest: testScreenshots,
}, process.argv.slice(2));
