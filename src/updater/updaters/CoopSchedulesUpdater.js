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
}

module.exports = CoopSchedulesUpdater;
