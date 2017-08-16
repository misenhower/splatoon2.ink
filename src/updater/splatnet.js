require('./bootstrap');
const axios = require('axios');

// SplatNet2 API
const api = axios.create({
    baseURL: 'https://app.splatoon2.nintendo.net/api/',
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

module.exports = {
    getSchedules,
    getTimeline,
    getFestivals,
}
