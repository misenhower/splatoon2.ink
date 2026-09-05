import { readJsonFile } from './utilities.js';

const brands = readJsonFile(new URL('./data/brands.json', import.meta.url));
const skills = readJsonFile(new URL('./data/skills.json', import.meta.url));
const inkipediaGear = readJsonFile(new URL('./data/gear.json', import.meta.url));

export function getOriginalGear(gear) {
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
