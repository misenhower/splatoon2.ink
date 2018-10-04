require('./bootstrap');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// SplatNet2 API
const userAgent = process.env.SPLATNET_USER_AGENT;
const splatnetBaseUrl = 'https://app.splatoon2.nintendo.net';

class SplatNet {
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

    getClient() {
        return axios.create({
            baseURL: `${splatnetBaseUrl}/api/`,
            headers: {
                'User-Agent': userAgent,
                'Cookie': `iksm_session=${this.getSessionId()}`,
                'Accept-Language': this.language,
            },
        });
    }

    async getResponse(path) {
        let response = await this.getClient().get(path);
        return response.data;
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

    async getImage(imagePath) {
        let response = await axios.get(`${splatnetBaseUrl}${imagePath}`, { responseType: 'arraybuffer', headers: { 'User-Agent': userAgent } });
        return response.data;
    }
}

module.exports = SplatNet;
