import TwitterPostBase from './TwitterPostBase.js';
import { captureSplatfestScreenshot } from '../../screenshots/index.js';
import { splatoonRegions } from '../../../common/regions.js';

export default class SplatfestTweet extends TwitterPostBase {
    constructor(region, storage, clients) {
        super(storage, clients);

        this.region = region;
        this.regionInfo = this.getRegionInfo();
    }

    getRegionInfo() {
        return splatoonRegions.find(r => r.key == this.region);
    }

    getKey() { return `splatfest-${this.region}`; }
    getName() { return `Splatfest: ${this.regionInfo.name}`; }

    async getFestivals(region = null) {
        region = region || this.region;

        let festivals = await this.readData('festivals.json');
        return festivals[region].festivals;
    }

    async getResults() {
        let festivals = await this.readData('festivals.json');
        return festivals[this.region].results;
    }

    async getData(region = null) {
        let time = await this.getDataTime();
        let festivals = await this.getFestivals(region);

        // Festival announced
        let festival = festivals.find(f => f.times.announce == time);
        if (festival)
            return { festival, type: 'announce' };

        // Festival started
        festival = festivals.find(f => f.times.start == time);
        if (festival)
            return { festival, type: 'start' };

        // Festival results
        festival = festivals.find(f => f.times.result == time);
        if (festival) {
            // We only want to post the results tweet if we actually have results
            let results = (await this.getResults()).find(r => r.festival_id == festival.festival_id);
            if (results)
                return { festival, results, type: 'result' };
        }

        // Festival ended
        festival = festivals.find(f => f.times.end == time);
        if (festival)
            return { festival, type: 'end' };

        // Festival reminders
        let reminders = [
            { time: 60 * 60 * 24, text: 'just 24 hours' },
            // { time: 60 * 60 * 24 * 2, text: '2 days' },
            { time: 60 * 60 * 24 * 3, text: '3 days' },
            { time: 60 * 60 * 24 * 7, text: '1 week' },
        ];

        for (let { time: offset, text } of reminders) {
            festival = festivals.find(f => f.times.start == time + offset);
            if (festival)
                return { festival, type: 'reminder', text };
        }
    }

    // Which regions have this Splatfest?
    async regions(festival = null) {
        if (!festival)
            festival = await this.getData();

        if (!festival)
            return false;

        let regions = [];
        for (let region of ['na', 'eu', 'jp'])
            if ((await this.getFestivals(region)).find(f => f.festival_id == festival.festival.festival_id))
                regions.push(region);
        return regions;
    }

    // Is the current event (e.g., announcement, results, etc.) occurring simultaneously across all regions?
    async isSimultaneous() {
        for (let region of await this.regions())
            if (!await this.getData(region))
                return false;
        return true;
    }

    async shouldPostForCurrentTime(client) {
        if (await super.shouldPostForCurrentTime(client)) {
            // Prevent duplicate tweets for Splatfests occurring in multiple regions
            return (this.region == (await this.regions())[0] || !await this.isSimultaneous());
        }

        return false;
    }

    async getTestData() {
        return { festival: (await this.getFestivals())[0], type: 'start' };
    }

    async getImage(data) {
        return captureSplatfestScreenshot(this.region, await this.getDataTime(), await this.regions(data));
    }

    async getText(data) {
        let regions = await this.regions();
        let isSimultaneous = await this.isSimultaneous();
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
                    return `Reminder: The ${isGlobal ? 'global' : regionDemonyms} Splatfest starts in ${data.text}! #splatfest #splatoon2`;
                return `Reminder: The Splatfest starts in ${this.regionInfo.name} in ${data.text}! #splatfest #splatoon2`;

            case 'end': {
                let hours = (data.festival.times.result - await this.getDataTime()) / 60 / 60;
                let duration = (hours == 1) ? '1 hour' : `${hours} hours`;
                if (isSimultaneous)
                    return `The ${isGlobal ? 'global' : regionDemonyms} Splatfest is now closed. Results will be posted in ${duration}! #splatfest #splatoon2`;
                return `The Splatfest is now closed in ${this.regionInfo.name}. Results will be posted in ${duration}! #splatfest #splatoon2`;
            }

            case 'result': {
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
}
