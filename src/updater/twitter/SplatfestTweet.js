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

    getFestivals(region = null) {
        region = region || this.region;

        let festivals = readData('festivals.json');
        return festivals[region].festivals;
    }

    getResults() {
        let festivals = readData('festivals.json');
        return festivals[this.region].results;
    }

    getData(region = null) {
        // Festival announced
        let festival = this.getFestivals(region).find(f => f.times.announce == this.getDataTime());
        if (festival)
            return { festival, type: 'announce' };

        // Festival started
        festival = this.getFestivals(region).find(f => f.times.start == this.getDataTime());
        if (festival)
            return { festival, type: 'start' };

        // Festival results
        festival = this.getFestivals(region).find(f => f.times.result == this.getDataTime());
        if (festival) {
            // We only want to post the results tweet if we actually have results
            let results = this.getResults().find(r => r.festival_id == festival.festival_id);
            if (results)
                return { festival, results, type: 'result' };
        }
    }

    isGlobal() {
        // Is this a global Splatfest?

        let festival = this.getData();
        if (!festival)
            return false;

        // Look for the same festival ID in each region
        for (let region of ['na', 'eu', 'jp']) {
            // If the festival ID doesn't exist in this region, it's not a global festival
            if (!this.getFestivals(region).find(f => f.festival_id == festival.festival.festival_id))
                return false;
        }

        // If we reach this point, this festival ID exists in all regions
        return true;
    }

    isSimultaneous() {
        // Is the current event (e.g., announcement, results, etc.) occurring simultaneously across all regions?

        let festivalIds = { na: null, eu: null, jp: null };
        for (let region in festivalIds) {
            let f = this.getData(region)
            if (f)
                festivalIds[region] = f.festival.festival_id;
        }

        // Make sure we have a festival ID and that all festival IDs are the same
        return (festivalIds.na && festivalIds.na == festivalIds.eu && festivalIds.na == festivalIds.jp);
    }

    shouldPostForCurrentTime() {
        if (super.shouldPostForCurrentTime()) {
            // If this is a simultaneous event, only post the tweets from the NA instance to prevent duplicate tweets
            return (this.region == 'na' || !this.isSimultaneous());
        }

        return false;
    }

    getTestData() {
        return { festival: this.getFestivals()[0], type: 'start' };
    }

    getImage(data) {
        return captureSplatfestScreenshot(this.region, data.festival.times[data.type], this.isSimultaneous());
    }

    getText(data) {
        let isGlobal = this.isGlobal();
        let isSimultaneous = this.isSimultaneous();
        let region;

        switch (data.type) {
            case 'announce':
                region = (isSimultaneous) ? 'global' : this.regionDemonym;
                return `You can now vote in the next ${region} Splatfest: ${data.festival.names.alpha_short} vs ${data.festival.names.bravo_short}! #splatfest #splatoon2`;
            case 'start':
                if (isSimultaneous)
                    return `The global Splatfest is now open! #splatfest #splatoon2`;
                if (isGlobal)
                    return `The global Splatfest is now open in ${this.regionName}! #splatfest #splatoon2`;
                return `The ${this.regionDemonym} Splatfest is now open! #splatfest #splatoon2`;
            case 'result':
                let winner = data.results.summary.total ? 'bravo' : 'alpha';

                // Just hardcoding this in here for now to avoid dealing with loading the Vuex store separately
                // since I might be moving everything over to Vuex in the future anyway.
                let resultsFormat = (this.region == 'jp') ? '{team}チームの勝利！' : 'Team {team} wins!';
                let teamName = (winner == 'alpha') ? data.festival.names.alpha_short : data.festival.names.bravo_short;
                let results = resultsFormat.replace('{team}', teamName);

                region = (isGlobal) ? 'Global' : this.regionDemonym;
                return `${region} Splatfest results: ${results} #splatfest #splatoon2`;
        }
    }
}

module.exports = SplatfestTweet;
