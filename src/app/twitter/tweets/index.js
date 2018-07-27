const ScheduleTweet = require('./ScheduleTweet');
const GearTweet = require('./GearTweet');
const SalmonRunTweet = require('./SalmonRunTweet');
const SalmonRunGearTweet = require('./SalmonRunGearTweet');
const NewWeaponTweet = require('./NewWeaponTweet');
const NewStageTweet = require('./NewStageTweet');
const SplatfestTweet = require('./SplatfestTweet');

module.exports = [
    new ScheduleTweet,
    new GearTweet,
    new SalmonRunTweet,
    new SalmonRunGearTweet,
    new NewWeaponTweet,
    new NewStageTweet,
    new SplatfestTweet('na'),
    new SplatfestTweet('eu'),
    new SplatfestTweet('jp'),
];
