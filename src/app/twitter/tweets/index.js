import ScheduleTweet from './ScheduleTweet.js';
import GearTweet from './GearTweet.js';
import SalmonRunTweet from './SalmonRunTweet.js';
// import SalmonRunGearTweet from './SalmonRunGearTweet.js';
import NewWeaponTweet from './NewWeaponTweet.js';
import NewStageTweet from './NewStageTweet.js';
import SplatfestTweet from './SplatfestTweet.js';

/**
 * @param {{ publicStorage: object, privateStorage: object }} storage
 * @param {object[]} clients
 */
export function createTweets(storage, clients) {
    return [
        new ScheduleTweet(storage, clients),
        new GearTweet(storage, clients),
        new SalmonRunTweet(storage, clients),
        // new SalmonRunGearTweet(storage, clients),
        new NewWeaponTweet(storage, clients),
        new NewStageTweet(storage, clients),
        new SplatfestTweet('na', storage, clients),
        new SplatfestTweet('eu', storage, clients),
        new SplatfestTweet('jp', storage, clients),
    ];
}
