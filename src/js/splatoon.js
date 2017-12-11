const brands = require('./data/brands');
const skills = require('./data/skills');
const inkipediaGear = require('./data/inkipediaGear');

function getOriginalGear(gear) {
    if (!gear || !gear.name)
        return;

    let name = gear.name.toLowerCase().trim();

    let originalGear = inkipediaGear[gear.kind].find(ig => ig.name.toLowerCase() == name);

    if (!originalGear)
        return null;

    let brand = brands[originalGear.brand];
    brand.frequent_skill = skills[brand.frequent_skill];

    return Object.assign({}, originalGear, {
        brand,
        skill: skills[originalGear.skill],
    });
}

module.exports = {
    getOriginalGear,
}
