const path = require('path');
const { URL } = require('url');
const http = require('http');
const ecstatic = require('ecstatic');
const puppeteer = require('puppeteer');

const viewport = {
    // Using a 16:9 ratio here by default to match Twitter's image card dimensions
    // 1216 was chosen as the width because of Bulma's "widescreen" breakpoint
    width: 1216,
    height: 684,
    deviceScaleFactor: 2,
};

function startHttpServer() {
    return new Promise((resolve, reject) => {
        const handler = ecstatic({ root: './dist' });
        const server = http.createServer(handler);
        server.on('listening', () => resolve(server));
        server.listen();
    });
}

function getBrowser() {
    // Use Browserless when configured
    if (process.env.USE_BROWSERLESS) {
        return puppeteer.connect({
            browserWSEndpoint: process.env.BROWSERLESS_ENDPOINT,
        });
    }

    // Otherwise just launch normally
    return puppeteer.launch({
        args: [
            '--no-sandbox', // Allow running as root inside the Docker container
        ],
        // headless: false, // For testing
    });
}

async function captureScreenshot(options) {
    // Create an HTTP server
    const server = await startHttpServer();
    const { port } = server.address();

    // Launch a new Chrome instance
    const browser = await getBrowser();

    // Create a new page and set the viewport
    const page = await browser.newPage();
    let thisViewport = Object.assign({}, viewport, options.viewport);
    page.setViewport(thisViewport);

    // Navigate to the URL
    let host = process.env.SCREENSHOT_HOST || 'localhost';
    let url = new URL(`http://${host}:${port}/screenshots.html`);
    url.hash = options.hash;
    await page.goto(url, {
        waitUntil: 'networkidle0', // Wait until the network is idle
    });

    // Take the screenshot
    let result = await page.screenshot();

    // Close the browser and HTTP server
    await browser.close();
    server.close();

    return result;
}

function captureScheduleScreenshot(now, splatfestBattle = false) {
    let hash = `/schedules/${now}`;

    return captureScreenshot({ hash });
}

function captureGearScreenshot(now) {
    let hash = `/splatNetGear/${now}`;

    return captureScreenshot({ hash });
}

function captureSalmonRunScreenshot(now, mode) {
    let hash = `/salmonRun/${now}?mode=${mode}`;

    return captureScreenshot({ hash });
}

function captureSalmonRunGearScreenshot(now) {
    let hash = `/salmonRunGear/${now}`;

    return captureScreenshot({ hash });
}

function captureNewWeaponScreenshot(now, weaponCount) {
    let hash = `/newWeapon/${now}`;

    // There are a max of 4 weapons per row
    const rows = Math.ceil(weaponCount / 4);
    // Determine the image height based on the number of rows
    let height = rows * 320;
    // Add some extra height for the bottom banner
    height += 60;
    // Set a minimum overall image height
    height = Math.max(height, 700);

    return captureScreenshot({ hash, viewport: { height }  });
}

function captureSplatfestScreenshot(region, now, regions) {
    regions = regions.join(',');
    let hash = `/splatfest/${region}/${now}?regions=${regions}`;

    return captureScreenshot({ hash });
}

module.exports = {
    captureScheduleScreenshot,
    captureGearScreenshot,
    captureSalmonRunScreenshot,
    captureSalmonRunGearScreenshot,
    captureNewWeaponScreenshot,
    captureSplatfestScreenshot,
}
