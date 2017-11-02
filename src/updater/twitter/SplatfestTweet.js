const TwitterPostBase = require('./TwitterPostBase');
const { captureSplatfestScreenshot } = require('../screenshots');
const { readData } = require('./utilities');
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
        return this.getFestivals().find(f => f.times.start == this.getDataTime());
    }

    getTestData() {
        return this.getFestivals()[0];
    }

    getImage(data) {
        return captureSplatfestScreenshot(this.region, data.times.start);
    }

    getText(data) {
        return `The ${this.regionDemonym} Splatfest is now open! #splatfest #splatoon2`;
    }
}

module.exports = SplatfestTweet;
