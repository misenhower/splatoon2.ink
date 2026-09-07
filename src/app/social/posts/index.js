import SchedulePost from './SchedulePost.js';
import GearPost from './GearPost.js';
import SalmonRunPost from './SalmonRunPost.js';
// import SalmonRunGearPost from './SalmonRunGearPost.js';
import NewWeaponPost from './NewWeaponPost.js';
import NewStagePost from './NewStagePost.js';
import SplatfestPost from './SplatfestPost.js';

/**
 * @param {{ publicStorage: object, privateStorage: object }} storage
 * @param {object[]} clients
 */
export function createPosts(storage, clients) {
    return [
        new SchedulePost(storage, clients),
        new GearPost(storage, clients),
        new SalmonRunPost(storage, clients),
        // new SalmonRunGearPost(storage, clients),
        new NewWeaponPost(storage, clients),
        new NewStagePost(storage, clients),
        new SplatfestPost('na', storage, clients),
        new SplatfestPost('eu', storage, clients),
        new SplatfestPost('jp', storage, clients),
    ];
}
