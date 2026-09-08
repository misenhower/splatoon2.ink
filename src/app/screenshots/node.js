import { createServer } from 'node:http';
import { access } from 'node:fs/promises';
import handler from 'serve-handler';
import BrowserRunClient from './BrowserRunClient.js';
import PuppeteerRenderer from './PuppeteerRenderer.js';
import ScreenshotGenerator from './ScreenshotGenerator.js';

// Provider selection and the temporary file server belong to the Node command.
// The Worker constructs its BrowserRunClient directly.
export async function withScreenshots(
    callback,
    { provider = process.env.SCREENSHOT_PROVIDER, siteUrl = process.env.SITE_URL, url } = {},
) {
    let renderer;

    if (provider === 'cloudflare') {
        renderer = new BrowserRunClient({
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
            apiToken: process.env.CLOUDFLARE_BROWSER_RUN_API_TOKEN,
        });

        if (!siteUrl && !url)
            throw new Error('SITE_URL or --url is required for Cloudflare screenshots.');
    } else if (provider === 'puppeteer') {
        renderer = new PuppeteerRenderer();
    } else {
        throw new Error('SCREENSHOT_PROVIDER must be "puppeteer" or "cloudflare" (or pass --provider).');
    }

    let server;

    try {
        if (!siteUrl && !url) {
            await access('dist/screenshots.html').catch(() => {
                throw new Error(
                    'Missing dist/screenshots.html. Run npm run build, or set SITE_URL to your dev server.',
                );
            });

            server = createServer((request, response) => {
                handler(request, response, {
                    public: 'dist',
                    cleanUrls: false,
                    directoryListing: false,
                }).catch(error => {
                    console.error(error);
                    response.destroy();
                });
            });

            await new Promise((resolve, reject) => {
                server.once('error', reject);
                server.listen(0, '127.0.0.1', resolve);
            });

            siteUrl = `http://127.0.0.1:${server.address().port}`;
        }

        return await callback(new ScreenshotGenerator(renderer, siteUrl));
    } finally {
        if (server) {
            server.closeAllConnections();
            await new Promise(resolve => server.close(resolve));
        }
    }
}
