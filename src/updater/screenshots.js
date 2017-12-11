require('./bootstrap');
const path = require('path');
const { URL } = require('url');
const puppeteer = require('puppeteer');

const htmlPath = path.resolve('./public/screenshots.html');
const htmlUrl = new URL('file://'+htmlPath);
const viewport = {
    width: 1012, // Twitter's in-stream image width is 506px, 506*2 = 1012
    height: 600,
};

async function captureScreenshot(options) {
    // Launch a new Chrome instance
    const browser = await puppeteer.launch({
        args: [
            '--disable-web-security', // This allows us to retrieve file:// URLs via JS
            '--no-sandbox', // Allow running as root inside the Docker container
        ],
        // headless: false, // For testing
    });

    // Create a new page and set the viewport
    const page = await browser.newPage();
    let thisViewport = Object.assign({}, viewport, options.viewport);
    page.setViewport(thisViewport);

    // Navigate to the URL
    await page.goto(options.url, {
        waitUntil: 'networkidle0', // Wait until the network is idle
    });

    // Take the screenshot
    let result = await page.screenshot();

    // Close the browser
    await browser.close();

    return result;
}

function captureScheduleScreenshot(startTime) {
    let url = new URL(htmlUrl);
    url.hash = `/schedules/${startTime}`;

    return captureScreenshot({ url });
}

function captureGearScreenshot(startTime, endTime) {
    let url = new URL(htmlUrl);
    url.hash = `/splatNetGear/${startTime}/${endTime}`;

    return captureScreenshot({ url, viewport: { height: 700 } });
}

function captureSalmonRunScreenshot(startTime) {
    let url = new URL(htmlUrl);
    url.hash = `/salmonRun/${startTime}`;

    return captureScreenshot({ url });
}

function captureSalmonRunGearScreenshot(startTime) {
    let url = new URL(htmlUrl);
    url.hash = `/salmonRunGear/${startTime}`;

    return captureScreenshot({ url });
}

function captureNewWeaponScreenshot(releaseTime) {
    let url = new URL(htmlUrl);
    url.hash = `/newWeapon/${releaseTime}`;

    return captureScreenshot({ url });
}

function captureSplatfestScreenshot(region, startTime) {
    let url = new URL(htmlUrl);
    url.hash = `/splatfest/${region}/${startTime}`;

    return captureScreenshot({ url });
}

module.exports = {
    captureScheduleScreenshot,
    captureGearScreenshot,
    captureSalmonRunScreenshot,
    captureSalmonRunGearScreenshot,
    captureNewWeaponScreenshot,
    captureSplatfestScreenshot,
}
