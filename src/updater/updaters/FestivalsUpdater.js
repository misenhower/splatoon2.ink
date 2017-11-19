const Updater = require('./Updater');
const SplatNet = require('../splatnet');

class FestivalsUpdater extends Updater {
    constructor() {
        super({
            name: 'Festivals',
            filename: 'festivals.json',
            request: (splatnet) => splatnet.getCombinedFestivals(),
            imagePaths: [
                '$..images.alpha',
                '$..images.bravo',
                '$..images.panel',
                '$..special_stage.image',
            ],
        });
    }

    async getData() {
        return {
            na: await this.options.request(new SplatNet('NA')),
            eu: await this.options.request(new SplatNet('EU')),
            jp: await this.options.request(new SplatNet('JP')),
        }
    }
}

module.exports = FestivalsUpdater;
