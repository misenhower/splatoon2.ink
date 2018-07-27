// Note: this script is intended to be run during development (not in production).
// It updates the gear/brand/skill data located at /src/js/data/.

const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp').sync;
const axios = require('axios');
const retrieveGearData = require('./retrieveGearData');
const { writeFormattedJson } = require('@/common/utilities');
const he = require('he');

const dataPath = path.resolve('src/common/data');
const brandsFilename = `${dataPath}/brands.json`;
const skillsFilename = `${dataPath}/skills.json`;
const inkipediaGearFilename = `${dataPath}/gear.json`;

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

module.exports = async () => {
    mkdirp(dataPath);

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
    let inkipediaGear = { clothes: [], head: [], shoes: [] };
    let inkipediaSources = [
        'https://splatoonwiki.org/w/index.php?title=Template:Gear/S2_Headgear&action=edit',
        'https://splatoonwiki.org/w/index.php?title=Template:Gear/S2_Clothing&action=edit',
        'https://splatoonwiki.org/w/index.php?title=Template:Gear/S2_Shoes&action=edit',
    ];

    for (let url of inkipediaSources) {
        let response = await axios.get(url);

        let regex = /\{\{GearList\/Item.*?\}\}/g;
        let row;
        while (row = regex.exec(response.data)) {
            // Format: name=value|brand=value|...
            let details = row[0].split('|')
                .reduce((map, kvp) => { kvp = kvp.split('='); map[kvp[0]] = kvp[1]; return map; }, {});

            // Make sure we have the necessary info
            if (details.category && details.name && details.brand && details.ability && details.rarity) {
                let key;
                switch (details.category) {
                    case 'Clothing': key = 'clothes'; break;
                    case 'Headgear': key = 'head'; break;
                    case 'Shoes': key = 'shoes'; break;
                }
                if (!key)
                    continue;

                inkipediaGear[key].push({
                    name: he.decode(details.name),
                    brand: he.decode(details.brand),
                    price: details.cost ? parseInt(details.cost.replace(',', '')) : null,
                    skill: he.decode(details.ability),
                    rarity: parseInt(details.rarity) - 1,
                });
            }
        }
    }

    // Process Inkipedia gear
    for (let item of [].concat(Object.values(inkipediaGear.head), Object.values(inkipediaGear.clothes), Object.values(inkipediaGear.shoes))) {
        let brand = Object.values(brands).find(b => b.name == item.brand);
        if (!brand)
            throw `Couldn't find brand: ${item.brand}`;
        item.brand = brand.id;

        let skill = Object.values(skills).find(s => s.name == item.skill);
        if (!skill)
            throw `Couldn't find skill: ${item.skill}`;
        item.skill = skill.id;
    }

    // Write out the data
    writeFormattedJson(brandsFilename, brands);
    writeFormattedJson(skillsFilename, skills);
    writeFormattedJson(inkipediaGearFilename, inkipediaGear);
};
