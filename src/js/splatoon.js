const skills = require('./data/skills');
const inkipediaGear = require('./data/inkipediaGear');

function getOriginalGear(gear) {
    if (!gear)
        return;

    let originalGear = inkipediaGear[gear.kind].find(ig => ig.name == gear.name);

    if (!originalGear)
        return;

    return Object.assign({}, originalGear, { skill: skills[originalGear.skill] });
}

module.exports = {
    getOriginalGear,
}
