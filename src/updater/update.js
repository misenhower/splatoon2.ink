require('./bootstrap');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const splatnet = require('./splatnet');
const retrieveWeapons = require('./retrieveWeapons');
const salmoncalendar = require('./salmoncalendar');
const raven = require('raven');

const dataPath = path.resolve('public/data');
const splatnetImagePath = path.resolve('public/assets/img/splatnet');

/**
 * Updaters
 */

async function updateSchedules() {
    let data = await handleRequest({
        title: 'map schedules',
        filename: `${dataPath}/schedules.json`,
        request: splatnet.getSchedules(),
    });

    // Download stage images
    if (data) {
        for (let type of ['regular', 'gachi', 'league']) {
            if (data[type]) {
                for (let schedule of data[type]) {
                    await maybeDownloadImage(schedule.stage_a.image);
                    await maybeDownloadImage(schedule.stage_b.image);
                }
            }
        }
    }
}

function updateTimeline() {
    return handleRequest({
        title: 'timeline',
        filename: `${dataPath}/timeline.json`,
        request: splatnet.getTimeline(),
        transformer: responseData => {
            // Filter out everything but the data we need
            let data = { coop: null };
            if (responseData.coop && responseData.coop.importance > -1)
                data.coop = responseData.coop;
            return data;
        },
    });
}

async function updateFestivals() {
    let data = await handleRequest({
        title: 'festivals',
        filename: `${dataPath}/festivals.json`,
        request: async function() {
            return {
                na: await splatnet.getNAFestivals(),
                eu: await splatnet.getEUFestivals(),
                jp: await splatnet.getJPFestivals(),
            };
        }(),
    });

    // Download banner/stage images
    if (data) {
        for (let region of ['na', 'eu', 'jp']) {
            let festival = data[region].festivals[0];
            if (festival) {
                await maybeDownloadImage(festival.images.alpha);
                await maybeDownloadImage(festival.images.bravo);
                await maybeDownloadImage(festival.images.panel);
                await maybeDownloadImage(festival.special_stage.image);
            }
        }
    }
}

async function updateMerchandises() {
    let data = await handleRequest({
        title: 'merchandises',
        filename: `${dataPath}/merchandises.json`,
        request: splatnet.getMerchandises(),
        transformer: responseData => {
            // Filter out everything but the data we need
            let data = { merchandises: null };
            if (responseData.merchandises)
                data.merchandises = responseData.merchandises;
            return data;
        },
    });

    // Download merchandise/skill images
    if (data && data.merchandises) {
        for (let merchandise of data.merchandises) {
            await maybeDownloadImage(merchandise.gear.image);
            await maybeDownloadImage(merchandise.gear.brand.image);
            await maybeDownloadImage(merchandise.gear.brand.frequent_skill.image);
            await maybeDownloadImage(merchandise.skill.image);
        }
    }
}

async function updateWeapons() {
    // This one is handled a little differently since we need to add to the existing data
    // instead of just overwriting it. We don't have a way to retrieve a complete set
    // of weapon data, so we have to make sure not to lose any weapons we already know about.

    let filename = `${dataPath}/weapons.json`;

    // Look for weapons used over the past 24 hours if we don't have an existing list of weapons.
    let iterations = 12;
    let weapons = {};

    if (fs.existsSync(filename)) {
        weapons = JSON.parse(fs.readFileSync(filename));

        // If we already have a weapons file, only retrieve the most recent results
        iterations = 1;
    }

    // We're now ready to update the weapons
    await handleRequest({
        title: 'weapons',
        filename,
        request: retrieveWeapons(iterations),
        transformer: responseData => {
            // Add the new weapons to the existing list of weapons
            return Object.assign(weapons, responseData);
        },
    });

    // Get weapon images
    for (let weapon of Object.values(weapons))
        await maybeDownloadImage(weapon.image);
}

function updateSalmonRunCalendar() {
    return handleRequest({
        title: 'Salmon Run calendar',
        filename: `${dataPath}/salmonruncalendar.json`,
        request: salmoncalendar.getSalmonRunCalendar(),
    });
}

async function updateAll() {
    await updateSchedules();
    await updateTimeline();
    await updateFestivals();
    await updateMerchandises();
    await updateWeapons();
    await updateSalmonRunCalendar();

    return 'Done.';
}

/**
 * Utility functions
 */

function writeFile(filename, data) {
    mkdirp(path.dirname(filename));
    fs.writeFileSync(filename, data);
}

async function handleRequest(options) {
    options = Object.assign({ isJson: true }, options);

    console.info(`Updating ${options.title}...`);

    try {
        // Get the response data
        let data = await options.request;

        // If we have a data transformer, use it
        if (options.transformer)
            data = options.transformer(data);

        let fileData = (options.isJson) ? JSON.stringify(data) : data;

        // Write the data
        writeFile(options.filename, fileData);
        console.info(`Updated ${options.title}.`);

        return data;
    } catch (e) {
        raven.captureException(e);
        console.error(`Couldn\'t update ${options.title}.`);
        console.error(e);
    }
}

function maybeDownloadImage(imagePath) {
    let filename = path.basename(imagePath);
    let localPath = `${splatnetImagePath}/${filename}`;

    // If we've already downloaded the image, we don't need to do anything
    if (fs.existsSync(localPath))
        return;

    // Otherwise, download the image
    return handleRequest({
        title: `image ${filename}`,
        filename: localPath,
        request: splatnet.getImage(imagePath),
        isJson: false,
    });
}

module.exports = {
    updateSchedules,
    updateTimeline,
    updateFestivals,
    updateMerchandises,
    updateWeapons,
    updateSalmonRunCalendar,
    updateAll,
}

require('make-runnable/custom')({ printOutputFrame: false });
