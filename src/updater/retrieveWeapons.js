const delay = require('delay');
const splatnet = require('./splatnet');

/**
 * The SplatNet 2 API doesn't currently provide a way to retrieve weapon data directly.
 * There are, however, several API endpoints that provide weapon data along with their results.
 *
 * This function retrieves recent league match rankings and parses weapon data from those results.
 * This data is provided in blocks of 2 hours. Generally, retrieving the last 2-3 blocks of data
 * is enough to retrieve all currently-available weapons.
 */

module.exports = async function retrieveWeapons(iterations = 1, useDelay = true) {
    // Start from "now" and work backwards
    let date = new Date();
    date.setUTCMinutes(0);
    date.setUTCSeconds(0);

    // Hours must be in multiples of 2
    if (date.getUTCHours() % 2 == 1)
        date.setUTCHours(date.getUTCHours() - 1);

    let weapons = {};

    // We'll retrieve up to the number of iterations specified of result data.
    // For example: 2017-09-01 06:00, then 2017-09-01 04:00, then 2017-09-01 02:00, etc.

    for (let i = 0; i < iterations; i++) {
        // Start with the previous time block (2 hours ago) even on the first run
        date.setUTCHours(date.getUTCHours() - 2);

        let year = date.getUTCFullYear();
        let month = date.getUTCMonth() + 1;
        let day = date.getUTCDate();
        let hour = date.getUTCHours();

        // Get both team and pair rankings
        console.info(`Getting league rankings for ${year}-${month}-${day} hour ${hour}...`);
        let teamRanking = await splatnet.getLeagueMatchRanking(year, month, day, hour, 'T');
        let pairRanking = await splatnet.getLeagueMatchRanking(year, month, day, hour, 'P');

        // Process the results
        for (let ranking of [teamRanking, pairRanking]) {
            for (rankInfo of ranking.rankings) {
                for (player of rankInfo.tag_members)
                    weapons[player.weapon.id] = player.weapon;
            }
        }

        if (useDelay && (i + 1) < iterations)
            await delay(500);
    }

    return weapons;
}
