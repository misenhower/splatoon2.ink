const path = require('path');
const { URL } = require('url');
const http = require('http');
const ecstatic = require('ecstatic');
const puppeteer = require('puppeteer');

const viewport = {
    width: 1012, // Twitter's in-stream image width is 506px, 506*2 = 1012
    height: 600,
};

function startHttpServer() {
    return new Promise((resolve, reject) => {
        const handler = ecstatic({ root: './dist' });
        const server = http.createServer(handler);
        server.on('listening', () => resolve(server));
        server.listen();
    });
}

async function captureScreenshot(options) {
    // Create an HTTP server
    const server = await startHttpServer();
    const { port } = server.address();

    // Launch a new Chrome instance
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox', // Allow running as root inside the Docker container
        ],
        // headless: false, // For testing
    });

    // Create a new page and set the viewport
    const page = await browser.newPage();
    let thisViewport = Object.assign({}, viewport, options.viewport);
    page.setViewport(thisViewport);

    // Navigate to the URL
    let url = new URL(`http://localhost:${port}/screenshots.html`);
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

    let viewport = (splatfestBattle) ? { height: 780 } : undefined;

    return captureScreenshot({ hash, viewport });
}

function captureGearScreenshot(now) {
    let hash = `/splatNetGear/${now}`;

    return captureScreenshot({ hash, viewport: { height: 700 } });
}

function captureSalmonRunScreenshot(now) {
    let hash = `/salmonRun/${now}`;

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
