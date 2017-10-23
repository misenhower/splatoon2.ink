const skills = require('./data/skills');
const inkipediaGear = require('./data/inkipediaGear');

function getOriginalGear(gear) {
    if (!gear || !gear.name)
        return;

    let name = gear.name.toLowerCase().trim();

    let originalGear = inkipediaGear[gear.kind].find(ig => ig.name.toLowerCase() == name);

    if (!originalGear)
        return;

    return Object.assign({}, originalGear, { skill: skills[originalGear.skill] });
}

module.exports = {
    getOriginalGear,
}
