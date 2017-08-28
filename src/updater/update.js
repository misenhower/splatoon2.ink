require('./bootstrap');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const splatnet = require('./splatnet');
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
        filename: `${dataPath}/festivals-na.json`,
        request: splatnet.getFestivals(),
    });

    // Download banner/stage images
    if (data && data.festivals && data.festivals.length) {
        let festival = data.festivals[0];
        await maybeDownloadImage(festival.images.alpha);
        await maybeDownloadImage(festival.images.bravo);
        await maybeDownloadImage(festival.images.panel);
        await maybeDownloadImage(festival.special_stage.image);
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
    updateSalmonRunCalendar,
    updateAll,
}

require('make-runnable/custom')({ printOutputFrame: false });
