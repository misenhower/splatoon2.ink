require('./bootstrap');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// SplatNet2 API
const userAgent = process.env.SPLATNET_USER_AGENT;
const splatnetBaseUrl = 'https://app.splatoon2.nintendo.net';

function createApiClient(sessionId) {
    return axios.create({
        baseURL: `${splatnetBaseUrl}/api/`,
        headers: {
            'User-Agent': userAgent,
            'Cookie': `iksm_session=${sessionId}`,
        },
    });
}

const api = {
    NA: createApiClient(process.env.NINTENDO_SESSION_ID_NA),
    EU: createApiClient(process.env.NINTENDO_SESSION_ID_EU),
    JP: createApiClient(process.env.NINTENDO_SESSION_ID_JP),
}

async function getSchedules(region = 'NA') {
    let response = await api[region].get('schedules');
    return response.data;
}

async function getCoopSchedules(region = 'NA') {
    let response = await api[region].get('coop_schedules');
    return response.data;
}

async function getTimeline(region = 'NA') {
    let response = await api[region].get('timeline');
    return response.data;
}

async function getActiveFestivals(region = 'NA') {
    let response = await api[region].get('festivals/active');
    return response.data;
}

async function getPastFestivals(region = 'NA') {
    let response = await api[region].get('festivals/pasts');
    return response.data;
}

async function getCombinedFestivals(region = 'NA') {
    let active = await getActiveFestivals(region);
    let past = await getPastFestivals(region);

    return {
        festivals: active.festivals.concat(past.festivals),
        results: past.results,
    };
}

async function getMerchandises(region = 'NA') {
    let response = await api[region].get('onlineshop/merchandises');
    return response.data;
}

async function getLeagueMatchRanking(year, month, day, hour, type = 'T', region = 'ALL', apiRegion = 'NA') {
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

    let response = await api[apiRegion].get(`league_match_ranking/${year}${month}${day}${hour}${type}/${region}`);
    return response.data;
}

async function getResults(id = null, region = 'NA') {
    let url = (id) ? `results/${id}` : 'results';
    let response = await api[region].get(url);
    return response.data;
}

async function getImage(imagePath) {
    let response = await axios.get(`${splatnetBaseUrl}${imagePath}`, { responseType: 'arraybuffer', headers: { 'User-Agent': userAgent } });
    return response.data;
}

module.exports = {
    getSchedules,
    getCoopSchedules,
    getTimeline,
    getCombinedFestivals,
    getMerchandises,
    getLeagueMatchRanking,
    getResults,
    getImage,
}
