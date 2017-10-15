// Note: this script is intended to be run during development (not in production).
// It updates the gear/brand/skill data located at /src/js/data/.

require('./bootstrap');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const axios = require('axios');
const retrieveGearData = require('./retrieveGearData');
const stringify = require('json-stable-stringify');

const dataPath = path.resolve('src/js/data');
const brandsFilename = `${dataPath}/brands.json`;
const skillsFilename = `${dataPath}/skills.json`;
const inkipediaGearFilename = `${dataPath}/inkipediaGear.json`;

mkdirp(dataPath);

function applyData(oldData, newData) {
    if (!Array.isArray(newData))
        newData = Object.values(newData);

    for (let data of newData) {
        if (data.id in oldData)
            Object.assign(oldData[data.id], data);
        else
            oldData[data.id] = data;
    }
}

(async () => {
    let brands = {};
    let skills = {};

    // Retrieve existing gear/brand/skill data if it exists
    if (fs.existsSync(brandsFilename))
        brands = JSON.parse(fs.readFileSync(brandsFilename));
    if (fs.existsSync(skillsFilename))
        skills = JSON.parse(fs.readFileSync(skillsFilename));

    // Update gear/brand/skill data from SplatNet
    // (This takes a while and doesn't need to be updated frequently, so just disabling this here for now)
    if (false) {
        let gearData = await retrieveGearData();

        applyData(brands, gearData.brands);
        applyData(skills, gearData.skills);
    }

    // Process brands
    for (let brand of Object.values(brands)) {
        if (brand.frequent_skill && typeof brand.frequent_skill === 'object')
            brand.frequent_skill = brand.frequent_skill.id;
    }

    // Retrieve data from Inkipedia
    let inkipediaGear = {};
    let inkipediaSources = {
        head: 'https://splatoonwiki.org/w/index.php?title=Template:Gear/S2_Headgear&action=edit',
        clothes: 'https://splatoonwiki.org/w/index.php?title=Template:Gear/S2_Clothing&action=edit',
        shoes: 'https://splatoonwiki.org/w/index.php?title=Template:Gear/S2_Shoes&action=edit',
    }

    for (let key in inkipediaSources) {
        inkipediaGear[key] = [];

        let response = await axios.get(inkipediaSources[key]);

        let regex = /\{\{GearList\/Item.*?filter/g;
        let row;
        while (row = regex.exec(response.data)) {
            let details = /name=(.*?)\|brand=(.*?)\|cost=(.*?)\|ability=(.*?)\|rarity=(.*?)\|/.exec(row[0]);
            if (details) {
                inkipediaGear[key].push({
                    name: details[1],
                    brand: details[2],
                    price: parseInt(details[3].replace(',', '')),
                    skill: details[4],
                    rarity: parseInt(details[5]) - 1,
                });
            }
        }
    }

    // Process Inkipedia gear
    for (let item of [].concat(Object.values(inkipediaGear.head), Object.values(inkipediaGear.clothes), Object.values(inkipediaGear.shoes))) {
        item.brand = Object.values(brands).find(b => b.name == item.brand).id;
        item.skill = Object.values(skills).find(s => s.name == item.skill).id;
    }

    // Write out the data
    fs.writeFileSync(brandsFilename, stringify(brands, { space: 4 }));
    fs.writeFileSync(skillsFilename, stringify(skills, { space: 4 }));
    fs.writeFileSync(inkipediaGearFilename, stringify(inkipediaGear, { space: 4 }));
})();
