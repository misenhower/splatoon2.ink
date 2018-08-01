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

function captureScheduleScreenshot(startTime) {
    let hash = `/schedules/${startTime}`;

    return captureScreenshot({ hash });
}

function captureGearScreenshot(startTime, endTime) {
    let hash = `/splatNetGear/${startTime}/${endTime}`;

    return captureScreenshot({ hash, viewport: { height: 700 } });
}

function captureSalmonRunScreenshot(startTime) {
    let hash = `/salmonRun/${startTime}`;

    return captureScreenshot({ hash });
}

function captureSalmonRunGearScreenshot(startTime) {
    let hash = `/salmonRunGear/${startTime}`;

    return captureScreenshot({ hash });
}

function captureNewWeaponScreenshot(releaseTime) {
    let hash = `/newWeapon/${releaseTime}`;

    return captureScreenshot({ hash });
}

function captureSplatfestScreenshot(region, startTime, regions) {
    regions = regions.join(',');
    let hash = `/splatfest/${region}/${startTime}?regions=${regions}`;

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
