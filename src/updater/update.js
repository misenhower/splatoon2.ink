require('./bootstrap');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const splatnet = require('./splatnet');
const salmoncalendar = require('./salmoncalendar');
const raven = require('raven');

const dataPath = path.resolve('public/data');

/**
 * Updaters
 */

function updateSchedules() {
    return handleRequest('map schedules', 'schedules.json', splatnet.getSchedules());
}

function updateTimeline() {
    return handleRequest('timeline', 'timeline.json', splatnet.getTimeline(), responseData => {
        // Filter out everything but the data we need
        let data = { coop: null };
        if (responseData.coop && responseData.coop.importance > -1)
            data.coop = responseData.coop;
        return data;
    });
}

function updateFestivals() {
    return handleRequest('festivals', 'festivals-na.json', splatnet.getFestivals());
}

function updateSalmonRunCalendar() {
    return handleRequest('Salmon Run calendar', 'salmonruncalendar.json', salmoncalendar.getSalmonRunCalendar());
}

async function updateAll() {
    await updateSchedules();
    await updateTimeline();
    await updateFestivals();
    await updateSalmonRunCalendar();

    return 'Done.';
}

/**
 * Utility functions
 */

function writeFile(filename, data) {
    mkdirp(dataPath);
    fs.writeFileSync(`${dataPath}/${filename}`, data);
}

async function handleRequest(title, filename, request, transformer = null) {
    console.info(`Updating ${title}...`);

    try {
        // Get the response data
        let data = await request;

        // If we have a data transformer, use it
        if (transformer)
            data = transformer(data);

        // Write the data
        writeFile(filename, JSON.stringify(data));
        console.info(`Updated ${title}.`);
    } catch (e) {
        raven.captureException(e);
        console.error(`Couldn\'t update ${title}.`);
    }
}

module.exports = {
    updateSchedules,
    updateTimeline,
    updateFestivals,
    updateSalmonRunCalendar,
    updateAll,
}

require('make-runnable/custom')({ printOutputFrame: false });
