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

    getResults() {
        let festivals = readData('festivals.json');
        return festivals[this.region].results;
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
        if (festival) {
            // We only want to post the results tweet if we actually have results
            let results = this.getResults().find(r => r.festival_id == festival.festival_id);
            if (results)
                return { festival, results, type: 'result' };
        }
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
                return `You can now vote in the next ${this.regionDemonym} Splatfest! #splatfest #splatoon2`;
            case 'start':
                return `The ${this.regionDemonym} Splatfest is now open! #splatfest #splatoon2`;
            case 'result':
                let winner = data.results.summary.total ? 'bravo' : 'alpha';

                // Just hardcoding this in here for now to avoid dealing with loading the Vuex store separately
                // since I might be moving everything over to Vuex in the future anyway.
                let resultsFormat = (this.region == 'jp') ? '{team}チームの勝利！' : 'Team {team} wins!';
                let teamName = (winner == 'alpha') ? data.festival.names.alpha_short : data.festival.names.bravo_short;
                let results = resultsFormat.replace('{team}', teamName);

                return `${this.regionDemonym} Splatfest results: ${results} #splatfest #splatoon2`;
        }
    }
}

module.exports = SplatfestTweet;
