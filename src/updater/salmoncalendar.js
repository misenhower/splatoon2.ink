require('./bootstrap');
const axios = require('axios');
const ical = require('ical.js');
const fs = require('fs');
const path = require('path');

async function getEventsFromCalendar() {
    let response = await axios.get(process.env.SALMON_RUN_CALENDAR_ICS_URL);

    let now = Math.trunc((new Date).getTime() / 1000);
    let schedules = [];

    // Parse the ical format
    let jcalData = ical.parse(response.data);
    let comp = new ical.Component(jcalData);
    let vevents = comp.getAllSubcomponents('vevent');
    vevents.forEach(vevent => {
        let event = new ical.Event(vevent);

        // We only care about Salmon Run events
        if (event.summary.toLowerCase().indexOf('salmon') === -1)
            return;

        let start_time = event.startDate.toUnixTime();
        let end_time = event.endDate.toUnixTime();

        // We only want events that haven't ended yet
        if (end_time < now)
            return;

        schedules.push({ start_time, end_time });
    });

    return schedules;
}

function getManualEvents() {
    let filename = path.resolve('manual-salmonrun.json');
    if (!fs.existsSync(filename))
        return [];
    return JSON.parse(fs.readFileSync(filename));
}

async function getSchedules() {
    let calendarEvents = await getEventsFromCalendar();
    let manualEvents = getManualEvents();

    let keyedSchedules = {};

    for (event of calendarEvents)
        keyedSchedules[event.start_time] = event;

    for (event of manualEvents) {
        if (event.start_time in keyedSchedules)
            Object.assign(keyedSchedules[event.start_time], event);
        else
            keyedSchedules[event.start_time] = event;
    }

    let schedules = Object.values(keyedSchedules);
    schedules.sort((a, b) => { return a.start_time - b.start_time });
    return { schedules };
}

module.exports = {
    getSchedules,
}
