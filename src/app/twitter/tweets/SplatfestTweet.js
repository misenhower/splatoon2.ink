const TwitterPostBase = require('./TwitterPostBase');
const { captureSplatfestScreenshot } = require('@/app/screenshots');
const { readData } = require('@/common/utilities');
const { splatoonRegions } = require('@/common/regions');

class SplatfestTweet extends TwitterPostBase {
    constructor(region) {
        super();

        this.region = region;
        this.regionInfo = this.getRegionInfo();
    }

    getRegionInfo() {
        return splatoonRegions.find(r => r.key == this.region);
    }

    getKey() { return `splatfest-${this.region}`; }
    getName() { return `Splatfest: ${this.regionInfo.name}`; }

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

        // Festival ended
        festival = this.getFestivals(region).find(f => f.times.end == this.getDataTime());
        if (festival)
            return { festival, type: 'end' };

        // Festival 24-hour reminder
        festival = this.getFestivals(region).find(f => f.times.start == this.getDataTime() + 24 * 60 * 60);
        if (festival)
            return { festival, type: 'reminder' };
    }

    // Which regions have this Splatfest?
    regions(festival = null) {
        if (!festival)
            festival = this.getData();

        if (!festival)
            return false;

        return ['na', 'eu', 'jp'].filter(region => this.getFestivals(region).find(f => f.festival_id == festival.festival.festival_id));
    }

    // Is the current event (e.g., announcement, results, etc.) occurring simultaneously across all regions?
    isSimultaneous() {
        return this.regions().every(region => this.getData(region))
    }

    shouldPostForCurrentTime() {
        if (super.shouldPostForCurrentTime()) {
            // Prevent duplicate tweets for Splatfests occurring in multiple regions
            return (this.region == this.regions()[0] || !this.isSimultaneous());
        }

        return false;
    }

    getTestData() {
        return { festival: this.getFestivals()[0], type: 'start' };
    }

    getImage(data) {
        return captureSplatfestScreenshot(this.region, this.getDataTime(), this.regions(data));
    }

    getText(data) {
        let regions = this.regions();
        let isSimultaneous = this.isSimultaneous();
        let isGlobal = regions.length === 3;

        let regionDemonyms = regions.map(region => splatoonRegions.find(r => r.key == region).demonym).join('/');

        switch (data.type) {
            case 'announce':
                return `You can now vote in the next ${isGlobal ? 'global' : regionDemonyms} Splatfest: ${data.festival.names.alpha_short} vs ${data.festival.names.bravo_short}! #splatfest #splatoon2`;

            case 'start':
                if (isSimultaneous)
                    return `The ${isGlobal ? 'global' : regionDemonyms} Splatfest is now open! #splatfest #splatoon2`;
                return `The Splatfest is now open in ${this.regionInfo.name}! #splatfest #splatoon2`;

            case 'reminder':
                if (isSimultaneous)
                    return `Reminder: The ${isGlobal ? 'global' : regionDemonyms} Splatfest starts in just 24 hours! #splatfest #splatoon2`;
                return `Reminder: The Splatfest starts in ${this.regionInfo.name} in just 24 hours! #splatfest #splatoon2`;

            case 'end':
                let hours = (data.festival.times.result - this.getDataTime()) / 60 / 60;
                let duration = (hours == 1) ? '1 hour' : `${hours} hours`;
                if (isSimultaneous)
                    return `The ${isGlobal ? 'global' : regionDemonyms} Splatfest is now closed. Results will be posted in ${duration}! #splatfest #splatoon2`;
                return `The Splatfest is now closed in ${this.regionInfo.name}. Results will be posted in ${duration}! #splatfest #splatoon2`;

            case 'result':
                let winner = data.results.summary.total ? 'bravo' : 'alpha';

                // Just hardcoding this in here for now to avoid dealing with loading the Vuex store separately
                // since I might be moving everything over to Vuex in the future anyway.
                let resultsFormat = (this.region == 'jp') ? '{team}チームの勝利！' : 'Team {team} wins!';
                let teamName = (winner == 'alpha') ? data.festival.names.alpha_short : data.festival.names.bravo_short;
                let results = resultsFormat.replace('{team}', teamName);

                return `${isGlobal ? 'Global' : regionDemonyms} Splatfest results: ${results} #splatfest #splatoon2`;
        }
    }
}

module.exports = SplatfestTweet;
