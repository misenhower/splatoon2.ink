const Updater = require('./Updater');
const SplatNet = require('@/common/splatnet');
const path = require('path');
const fs = require('fs');
const { getTopOfCurrentHour, readJson } = require('@/common/utilities');

const stagesPath = path.resolve('storage/stages.json');

class SchedulesUpdater extends Updater {
    constructor() {
        super({
            name: 'Schedules',
            filename: 'schedules.json',
            request: (splatnet) => splatnet.getSchedules(),
            imagePaths: [
                '$..stage_a.image',
                '$..stage_b.image',
            ],
            localization: [
                {
                    name: 'stages',
                    entities: [
                        '$..stage_a',
                        '$..stage_b',
                    ],
                    id: 'id',
                    values: 'name',
                },
                {
                    name: 'game_modes',
                    entities: '$..game_mode',
                    id: 'key',
                    values: 'name',
                },
                {
                    name: 'rules',
                    entities: '$..rule',
                    id: 'key',
                    values: ['name', 'multiline_name'],
                },
            ],
        });
    }

    async processData(data) {
        // We need to track whether there are any new stages included with this schedule update

        // If we don't have a "known stages" file, create it from the current list of stages
        if (!fs.existsSync(stagesPath)) {
            let splatnet = new SplatNet;
            let stageData = await splatnet.getStages();
            let stages = stageData.stages.map(s => Object.assign(s, { first_seen: -1, first_available: -1 }));
            this.writeFile(stagesPath, JSON.stringify(stages));
        }

        // Load known stages
        let stages = readJson(stagesPath);

        // Look for new stages (in Regular Battle)
        let sortedSchedules = data.regular.sort((a, b) => a.start_time - b.start_time);
        for (let schedule of sortedSchedules) {
            for (let stage of [schedule.stage_a, schedule.stage_b]) {
                // Have wee seen this stage before?
                let knownStage = stages.find(s => s.id == stage.id);

                if (!knownStage) {
                    // If we haven't seen the stage before, add it to the list with the current time
                    // and the time the stage will be first available.
                    stages.push(Object.assign({}, stage, {
                        first_seen: getTopOfCurrentHour(),
                        first_available: schedule.start_time,
                    }));
                }
            }
        }

        // Update the stages file
        this.writeFile(stagesPath, JSON.stringify(stages));

        return data;
    }
}

module.exports = SchedulesUpdater;
