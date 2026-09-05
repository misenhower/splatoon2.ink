import '../common/bootstrap.js';
import { runAction } from '../common/cli.js';
import updateGear from './updateGear.js';
import getSplatNetLanguageFiles from './getSplatNetLanguageFiles.js';
import copyTranslation from './copyTranslation.js';

await runAction({
    updateGear,
    getSplatNetLanguageFiles,
    copyTranslation,
}, process.argv.slice(2));
