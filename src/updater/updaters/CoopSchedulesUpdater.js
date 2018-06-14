const Updater = require('./Updater');

class CoopSchedulesUpdater extends Updater {
    constructor() {
        super({
            name: 'Co-op Schedules',
            filename: 'coop-schedules.json',
            calendarFilename: 'coop-schedules.ics',
            request: (splatnet) => splatnet.getCoopSchedules(),
            imagePaths: [
                '$..stage.image',
                '$..weapons[*].weapon.image',
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
                    entities: '$..weapons[?(@.id)].weapon',
                    id: 'id',
                    values: 'name',
                },
                {
                    name: 'weapon_subs',
                    entities: '$..weapons[?(@.id)].weapon.sub',
                    id: 'id',
                    values: 'name',
                },
                {
                    name: 'weapon_specials',
                    entities: '$..weapons[?(@.id)].weapon.special',
                    id: 'id',
                    values: 'name',
                },
            ],
        });
    }

    getCalendarEntries({ details, schedules }) {
        let events = [];

        // Add event information
        events.push(...schedules.map(event => ({
            id: `coop-${event.start_time}-${event.end_time}`,
            title: 'Salmon Run',
            start_time: event.start_time,
            end_time: event.end_time,
        })));

        // Add detailed event information
        for (let eventDetails of details) {
            let event = events.find(e => e.start_time === eventDetails.start_time);
            if (!event)
                continue;

            event.title = `Salmon Run on ${eventDetails.stage.name}`;
            event.location = eventDetails.stage.name;
            let weapons = eventDetails.weapons
                .map(weapon => weapon ? weapon.weapon : null)
                .map(weapon => weapon ? weapon.name : 'Random')
                .map(weapon => `\n • ${weapon}`)
                .join('');
            event.description = `Supplied Weapons:${weapons}`;
        }

        return events;
    }
}

module.exports = CoopSchedulesUpdater;
