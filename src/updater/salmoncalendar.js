require('./bootstrap');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const ical = require('ical.js');
const raven = require('raven');

const dataPath = path.resolve('public/data');

module.exports.update = function() {
    console.info('Updating Salmon Run calendar...');

    axios.get(process.env.SALMON_RUN_CALENDAR_ICS_URL).then(response => {
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

        schedules.sort((a, b) => { return a.start_time - b.start_time });

        fs.writeFile(`${dataPath}/salmonruncalendar.json`, JSON.stringify({ schedules }));
        console.info('Updated Salmon Run calendar.');
    }).catch(e => {
        raven.captureException(e);
        console.error('Couldn\'t update Salmon Run calendar.');
    });
}
