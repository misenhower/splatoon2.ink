const TwitterPostBase = require('./TwitterPostBase');
const { captureSplatfestScreenshot } = require('../screenshots');
const { readData } = require('../utilities');
const regions = require('../../js/regions');

class SplatfestTweet extends TwitterPostBase {
    constructor(region) {
        super();

        this.region = region;

        let regionInfo = this.getRegionInfo();
        this.regionName = regionInfo.name;
        this.regionDemonym = regionInfo.demonym;
    }

    getRegionInfo() {
        return regions.splatoonRegions.find(r => r.key == this.region);
    }

    getKey() { return `splatfest-${this.region}`; }
    getName() { return `Splatfest: ${this.regionName}`; }

    getFestivals() {
        let festivals = readData('festivals.json');
        return festivals[this.region].festivals;
    }

    getData() {
        // Festival announced
        let festival = this.getFestivals().find(f => f.times.announce == this.getDataTime());
        if (festival)
            return { festival, type: 'announce' };

        // Festival started
        festival = this.getFestivals().find(f => f.times.start == this.getDataTime());
        if (festival)
            return { festival, type: 'start' };

        // Festival results
        festival = this.getFestivals().find(f => f.times.result == this.getDataTime());
        if (festival)
            return { festival, type: 'result' };
    }

    getTestData() {
        return { festival: this.getFestivals()[0], type: 'start' };
    }

    getImage(data) {
        return captureSplatfestScreenshot(this.region, data.festival.times[data.type]);
    }

    getText(data) {
        switch (data.type) {
            case 'announce':
                return `You can now vote in the ${this.regionDemonym} Splatfest! #splatfest #splatoon2`;
            case 'start':
                return `The ${this.regionDemonym} Splatfest is now open! #splatfest #splatoon2`;
            case 'result':
                return `Results are in for the ${this.regionDemonym} Splatfest! #splatfest #splatoon2`;
        }
    }
}

module.exports = SplatfestTweet;
