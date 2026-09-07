import Updater from './Updater.js';
import SplatNet from '../../../common/splatnet.js';
import { getTopOfCurrentHour } from '../../../common/time.js';

const STAGES_KEY = 'stages.json'; // private storage

export default class SchedulesUpdater extends Updater {
    constructor(storage) {
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
        }, storage);
    }

    async processData(data) {
        // We need to track whether there are any new stages included with this schedule update

        // Load known stages, or create the list from the current list of stages
        let stages = await this.privateStorage.readJson(STAGES_KEY);
        if (!stages) {
            let splatnet = new SplatNet;
            let stageData = await splatnet.getStages();
            stages = stageData.stages.map(s => Object.assign(s, { first_seen: -1, first_available: -1 }));
        }

        // Look for new stages (in Regular Battle)
        let sortedSchedules = [...data.regular].sort((a, b) => a.start_time - b.start_time);
        for (let schedule of sortedSchedules) {
            for (let stage of [schedule.stage_a, schedule.stage_b]) {
                // Have we seen this stage before?
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
        await this.privateStorage.writeJson(STAGES_KEY, stages);

        return data;
    }
}
