const _ = require('lodash');
const iCal = require('cozy-ical');
const moment = require('moment-timezone');
const Updater = require('./Updater');

class CoopSchedulesUpdater extends Updater {
    constructor() {
        super({
            name: 'Co-op Schedules',
            filename: 'coop-schedules.json',
            request: (splatnet) => splatnet.getCoopSchedules(),
            imagePaths: [
                '$..stage.image',
                '$..weapons[*].image',
            ],
            localization: [
                {
                    name: 'coop_stages',
                    entities: '$..stage',
                    id: 'image', // Unfortunately these don't have an ID, so we'll just match them by image URL
                    values: 'name',
                },
                {
                    name: 'weapons',
                    entities: '$..weapons[?(@.id)]',
                    id: 'id',
                    values: 'name',
                },
                {
                    name: 'weapon_subs',
                    entities: '$..weapons[?(@.id)].sub',
                    id: 'id',
                    values: 'name',
                },
                {
                    name: 'weapon_specials',
                    entities: '$..weapons[?(@.id)].special',
                    id: 'id',
                    values: 'name',
                },
            ],
        });
    }

    processData(data) {
        this.exportCalendar(data);
        return data;
    }

    exportCalendar({ details, schedules }) {
        // Create a calendar object
        const calendar = new iCal.VCalendar({
            title: this.constructor.name,
            organization: 'splatoon2.ink'
        });

        // Set the calendar's native time zone to UTC
        calendar.add(new iCal.VTimezone({ timezone: 'Etc/UTC' }));

        // Add detailed event information
        details.forEach((jsonEvent) => {
            const calendarEvent = new iCal.VEvent({
                summary: `Salmon Run on ${jsonEvent.stage.name}`,
                location: jsonEvent.stage.name,
                startDate: moment.tz(jsonEvent.start_time * 1000, 'UTC'),
                endDate: moment.tz(jsonEvent.end_time * 1000, 'UTC'),
                description: (
                    'Supplied Weapons:\n • ' +
                    jsonEvent.weapons.map((weapon) => weapon ? weapon.name : 'Random').join('\n • ')
                ),
                stampDate: new Date(),
                uid: `coop-${jsonEvent.start_time}-${jsonEvent.end_time}`
            });

            calendar.add(calendarEvent);
        });

        // Add future event information
        schedules.forEach((jsonEvent) => {
            if (_.some(details, { start_time: jsonEvent.start_time, end_time: jsonEvent.end_time })) {
                return;
            }

            const calendarEvent = new iCal.VEvent({
                summary: 'Salmon Run',
                startDate: moment.tz(jsonEvent.start_time * 1000, 'UTC'),
                endDate: moment.tz(jsonEvent.end_time * 1000, 'UTC'),
                stampDate: new Date(),
                uid: `coop-${jsonEvent.start_time}-${jsonEvent.end_time}`
            });

            calendar.add(calendarEvent);
        });

        // Save next to the .json file
        const filename = this.getFilename().replace(/\.json$/, '.ics');

        const calendarString = calendar.toString();

        // Write the calendar data to disk
        this.writeFile(filename, calendarString);
    }
}

module.exports = CoopSchedulesUpdater;
