import puppeteer from 'puppeteer';

// This module is imported only by Node entry points, never by the Worker.
export default class PuppeteerRenderer {
    async capture({ url, viewport, readySelector }) {
        let browser = await puppeteer.launch({ timeout: 10_000, protocolTimeout: 10_000 });
        try {
            let page = await browser.newPage();
            page.setDefaultTimeout(10_000);
            await page.setViewport(viewport);
            await page.setCacheEnabled(false);
            let response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10_000 });
            if (!response?.ok())
                throw new Error(`Screenshot page failed (${response?.status() ?? 'no response'}): ${url}`);
            await page.waitForSelector(readySelector);
            return new Uint8Array(await page.screenshot({ type: 'png' }));
        } finally {
            await browser.close();
        }
    }
}
