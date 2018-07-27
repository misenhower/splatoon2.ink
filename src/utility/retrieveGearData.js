const delay = require('delay');
const splatnet = require('@/common/splatnet');

/**
 * We can't retrieve gear/brand/skill data directly.
 * This pulls data from the 50 most recent battles instead.
 */

module.exports = async function retrieveGearData() {
    let skills = {};
    let brands = {};
    let gear = { head: {}, clothes: {}, shoes: {} };

    console.info('Getting battle data...');
    let battleResultsData = await splatnet.getResults();
    for (let battle of battleResultsData.results) {
        await delay(250);

        console.info(`Getting data for battle #${battle.battle_number}...`);
        let battleData = await splatnet.getResults(battle.battle_number);

        // Find all gear and skills
        let players = [battleData.player_result].concat(battleData.my_team_members, battleData.other_team_members);
        for (player of players) {
            // Get the main and sub skills for each type of gear
            let gearSkills = [
                player.player.head_skills.main,
                player.player.clothes_skills.main,
                player.player.shoes_skills.main,
            ].concat(player.player.head_skills.subs, player.player.clothes_skills.subs, player.player.shoes_skills.subs);

            for (skill of gearSkills) {
                if (skill)
                    skills[skill.id] = skill;
            }

            // Get brands
            for (brand of [player.player.head.brand, player.player.clothes.brand, player.player.shoes.brand])
                brands[brand.id] = brand;

            // Get gear
            gear.head[player.player.head.id] = player.player.head;
            gear.clothes[player.player.clothes.id] = player.player.clothes;
            gear.shoes[player.player.shoes.id] = player.player.shoes;
        }
    }

    return { skills, brands, gear };
}
