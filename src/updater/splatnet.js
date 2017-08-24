require('./bootstrap');
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

async function getFestivals() {
    let response = await api.get('festivals/active');
    return response.data;
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
    getFestivals,
    getMerchandises,
    getImage,
}
