require('./bootstrap');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// SplatNet2 API
const userAgent = process.env.SPLATNET_USER_AGENT;
const splatnetBaseUrl = 'https://app.splatoon2.nintendo.net';
const api = axios.create({
    baseURL: `${splatnetBaseUrl}/api/`,
    headers: {
        'User-Agent': userAgent,
        'Cookie': `iksm_session=${process.env.NINTENDO_SESSION_ID}`,
    },
});

async function getSchedules() {
    let response = await api.get('schedules');
    return response.data;
}

async function getTimeline() {
    let response = await api.get('timeline');
    return response.data;
}

async function getNAFestivals() {
    let response = await api.get('festivals/active');
    return response.data;
}

function getManualFestivals(region) {
    let filePath = path.resolve('manual-festivals.json');
    if (!fs.existsSync(filePath))
        return { festivals: [] };

    let regionalFestivals = JSON.parse(fs.readFileSync(filePath));
    if (!regionalFestivals || !regionalFestivals[region])
        return { festivals: [] };

    return { festivals: regionalFestivals[region] };
}

async function getEUFestivals() {
    return getManualFestivals('eu');
}

async function getJPFestivals() {
    return getManualFestivals('jp');
}

async function getMerchandises() {
    let response = await api.get('onlineshop/merchandises');
    return response.data;
}

async function getLeagueMatchRanking(year, month, day, hour, type = 'T', region = 'ALL') {
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

    let response = await api.get(`league_match_ranking/${year}${month}${day}${hour}${type}/${region}`);
    return response.data;
}

async function getResults(id = null) {
    let url = (id) ? `results/${id}` : 'results';
    let response = await api.get(url);
    return response.data;
}

async function getImage(imagePath) {
    let response = await axios.get(`${splatnetBaseUrl}${imagePath}`, { responseType: 'arraybuffer', headers: { 'User-Agent': userAgent } });
    return response.data;
}

module.exports = {
    getSchedules,
    getTimeline,
    getNAFestivals,
    getEUFestivals,
    getJPFestivals,
    getMerchandises,
    getLeagueMatchRanking,
    getResults,
    getImage,
}
