import { test, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import PuppeteerRenderer from '../../src/app/screenshots/PuppeteerRenderer.js';
import { withScreenshots } from '../../src/app/screenshots/node.js';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

afterEach(() => mock.restoreAll());

test('local browser uses page readiness and closes on success or failure', async () => {
    let closed = 0;
    let fail = false;
    let ready;
    let page = {
        setDefaultTimeout(timeout) {
            assert.equal(timeout, 10_000);
        },
        async setViewport() {},
        async setCacheEnabled() {},
        async goto(url, options) {
            assert.equal(url, 'http://localhost:8080/screenshots.html');
            assert.equal(options.waitUntil, 'domcontentloaded');

            return { ok: () => true };
        },
        async waitForSelector(selector) {
            ready = selector;

            if (fail)
                throw new Error('Page not ready');
        },
        async screenshot(options) {
            assert.equal(options.type, 'png');

            return PNG;
        },
    };

    mock.method(puppeteer, 'launch', async () => ({
        newPage: async () => page,
        close: async () => {
            closed++;
        },
    }));

    let renderer = new PuppeteerRenderer();
    let options = {
        url: 'http://localhost:8080/screenshots.html',
        viewport: {},
        readySelector: '[data-screenshot-ready="true"]',
    };

    assert.deepEqual(await renderer.capture(options), PNG);
    assert.equal(ready, options.readySelector);

    fail = true;

    await assert.rejects(renderer.capture(options), /Page not ready/);
    assert.equal(closed, 2);
});

test('Node can select Cloudflare for a direct URL without SITE_URL or social data', async () => {
    let requests = [];

    mock.method(globalThis, 'fetch', async (url, init) => {
        requests.push(JSON.parse(init.body));

        return new Response(PNG);
    });

    let previous = { ...process.env };

    try {
        process.env.CLOUDFLARE_ACCOUNT_ID = 'account';
        process.env.CLOUDFLARE_BROWSER_RUN_API_TOKEN = 'token';

        let url = 'https://dev.example.test/screenshots.html#/schedules/3600';
        let result = await withScreenshots(screenshots => screenshots.capture({ url }), {
            provider: 'cloudflare',
            siteUrl: '',
            url,
        });

        assert.deepEqual(result.image, PNG);
        assert.equal(requests[0].url, url);
    } finally {
        process.env = previous;
    }
});

test('provider selection is explicit and Cloudflare requires a reachable target', async () => {
    await assert.rejects(
        withScreenshots(() => {}, { provider: 'unknown' }),
        /SCREENSHOT_PROVIDER/,
    );
    await assert.rejects(
        withScreenshots(() => {}, { provider: 'cloudflare', siteUrl: '' }),
        /SITE_URL or --url/,
    );
});

test('temporary dist server is loopback-only and closes when capture fails', async () => {
    let { mkdtemp, mkdir, writeFile, rm } = await import('node:fs/promises');
    let { tmpdir } = await import('node:os');
    let { join } = await import('node:path');
    let directory = await mkdtemp(join(tmpdir(), 'screenshot-server-'));
    let originalDirectory = process.cwd();
    let siteUrl;

    try {
        await mkdir(join(directory, 'dist'));
        await writeFile(join(directory, 'dist/screenshots.html'), '<html>local fixture</html>');
        process.chdir(directory);
        mock.method(PuppeteerRenderer.prototype, 'capture', async () => {
            throw new Error('Capture failed');
        });

        await assert.rejects(
            withScreenshots(
                async screenshots => {
                    siteUrl = screenshots.siteUrl;

                    assert.equal(new URL(siteUrl).hostname, '127.0.0.1');

                    let response = await fetch(new URL('/screenshots.html', siteUrl));

                    assert.match(await response.text(), /local fixture/);

                    return screenshots.capture({ hash: '/schedules/3600' });
                },
                { provider: 'puppeteer', siteUrl: '' },
            ),
            /Capture failed/,
        );
        await assert.rejects(fetch(siteUrl));
    } finally {
        process.chdir(originalDirectory);
        await rm(directory, { recursive: true, force: true });
    }
});
