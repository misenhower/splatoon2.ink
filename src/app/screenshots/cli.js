import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { withScreenshots } from './node.js';

// Capture-only: no social clients, checkpoints, or production-data comparisons.
if (existsSync('.env'))
    process.loadEnvFile();

try {
    let { values } = parseArgs({
        options: {
            url: { type: 'string' },
            hash: { type: 'string' },
            output: { type: 'string', default: 'dist/test-screenshots/capture.png' },
            help: { type: 'boolean' },
        },
    });

    if (values.help) {
        console.log(
            'Usage: npm run screenshot -- (--url <page URL> | --hash <screenshot route>) [--output <file.png>]',
        );
        console.log(
            'Uses local Puppeteer and SITE_URL from the environment or .env. Without SITE_URL, Puppeteer serves dist/ temporarily.',
        );
    } else {
        if (!!values.url === !!values.hash)
            throw new Error(
                'Specify exactly one of --url or --hash. Use --help for examples of the options.',
            );

        let result = await withScreenshots(screenshots => screenshots.capture(values), values);

        await mkdir(dirname(values.output), { recursive: true });
        await writeFile(values.output, result.image);

        console.log(`Saved ${result.width}×${result.height} PNG to ${values.output}`);
    }
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
