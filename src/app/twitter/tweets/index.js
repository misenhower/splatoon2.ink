import ScheduleTweet from './ScheduleTweet.js';
import GearTweet from './GearTweet.js';
import SalmonRunTweet from './SalmonRunTweet.js';
// import SalmonRunGearTweet from './SalmonRunGearTweet.js';
import NewWeaponTweet from './NewWeaponTweet.js';
import NewStageTweet from './NewStageTweet.js';
import SplatfestTweet from './SplatfestTweet.js';

export default [
    new ScheduleTweet,
    new GearTweet,
    new SalmonRunTweet,
    // new SalmonRunGearTweet,
    new NewWeaponTweet,
    new NewStageTweet,
    new SplatfestTweet('na'),
    new SplatfestTweet('eu'),
    new SplatfestTweet('jp'),
];
