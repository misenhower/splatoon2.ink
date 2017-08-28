require('./bootstrap');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// SplatNet2 API
const splatnetBaseUrl = 'https://app.splatoon2.nintendo.net';
const api = axios.create({
    baseURL: `${splatnetBaseUrl}/api/`,
    headers: {'Cookie': `iksm_session=${process.env.NINTENDO_SESSION_ID}`},
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

async function getImage(imagePath) {
    let response = await axios.get(`${splatnetBaseUrl}${imagePath}`, { responseType: 'arraybuffer' });
    return response.data;
}

module.exports = {
    getSchedules,
    getTimeline,
    getNAFestivals,
    getEUFestivals,
    getJPFestivals,
    getMerchandises,
    getImage,
}
