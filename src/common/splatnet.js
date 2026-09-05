import './bootstrap.js';

// SplatNet2 API
const userAgent = process.env.SPLATNET_USER_AGENT;
const splatnetBaseUrl = 'https://app.splatoon2.nintendo.net';

export default class SplatNet {
    constructor(region = 'NA', language = 'en-US') {
        this.region = region;
        this.language = language;
    }

    getSessionId() {
        switch (this.region) {
            case 'NA': return process.env.NINTENDO_SESSION_ID_NA;
            case 'EU': return process.env.NINTENDO_SESSION_ID_EU;
            case 'JP': return process.env.NINTENDO_SESSION_ID_JP;
        }
    }

    getHeaders() {
        return {
            ...(userAgent ? { 'User-Agent': userAgent } : {}),
            'Cookie': `iksm_session=${this.getSessionId()}`,
            'Accept-Language': this.language,
        };
    }

    /** Fetch a path (or absolute URL) on the SplatNet site with the session cookie. */
    async request(path, { headers = this.getHeaders() } = {}) {
        let url = new URL(path, splatnetBaseUrl);
        let response = await fetch(url, { headers });
        if (!response.ok)
            throw new Error(`SplatNet request failed with status ${response.status}: ${url.pathname}`);
        return response;
    }

    async getResponse(path) {
        let response = await this.request(`/api/${path}`);
        return response.json();
    }

    async getText(path) {
        let response = await this.request(path);
        return response.text();
    }

    getSchedules() {
        return this.getResponse('schedules');
    }

    getCoopSchedules() {
        return this.getResponse('coop_schedules');
    }

    getStages() {
        return this.getResponse('data/stages');
    }

    getTimeline() {
        return this.getResponse('timeline');
    }

    getActiveFestivals() {
        return this.getResponse('festivals/active');
    }

    getPastFestivals() {
        return this.getResponse('festivals/pasts');
    }

    async getCombinedFestivals() {
        let active = await this.getActiveFestivals();
        let past = await this.getPastFestivals();

        return {
            festivals: active.festivals.concat(past.festivals),
            results: past.results,
        };
    }

    getFestivalRankings(id) {
        return this.getResponse(`festivals/${id}/rankings`);
    }

    getMerchandises() {
        return this.getResponse('onlineshop/merchandises');
    }

    getLeagueMatchRanking(year, month, day, hour, type = 'T', region = 'ALL') {
        // Hour should be in multiples of 2, e.g., 00, 02, 04, ..., 22.
        // Type should be 'T' (team) or 'P' (pair).
        // Region should be 'ALL', 'JP', 'US', or 'EU'.

        // Make sure year is specified as two digits
        year = year % 100;

        // Make sure we have leading zeros
        year = ('0' + year).substr(-2);
        month = ('0' + month).substr(-2);
        day = ('0' + day).substr(-2);
        hour = ('0' + hour).substr(-2);

        return this.getResponse(`league_match_ranking/${year}${month}${day}${hour}${type}/${region}`);
    }

    getResults(id = null, region = 'NA') {
        let url = (id) ? `results/${id}` : 'results';
        return this.getResponse(url);
    }

    /** Download an image (no session cookie needed). Returns the bytes. */
    async getImage(imagePath) {
        let response = await this.request(imagePath, {
            headers: userAgent ? { 'User-Agent': userAgent } : {},
        });
        return new Uint8Array(await response.arrayBuffer());
    }
}
