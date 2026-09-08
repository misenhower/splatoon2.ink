import { createServer } from 'node:http';
import { access } from 'node:fs/promises';
import handler from 'serve-handler';
import PuppeteerRenderer from './PuppeteerRenderer.js';
import ScreenshotGenerator from './ScreenshotGenerator.js';

// The Node commands use local Chrome; Browser Run is tested through Wrangler.
export async function withScreenshots(
    callback,
    { siteUrl = process.env.SITE_URL, url } = {},
) {
    let renderer = new PuppeteerRenderer();
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
