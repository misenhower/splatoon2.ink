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
 * @param {import('../../screenshots/ScreenshotGenerator.js').default} screenshots
 */
export function createPosts(storage, clients, screenshots) {
    return [
        new SchedulePost(storage, clients, screenshots),
        new GearPost(storage, clients, screenshots),
        new SalmonRunPost(storage, clients, screenshots),
        // new SalmonRunGearPost(storage, clients, screenshots),
        new NewWeaponPost(storage, clients, screenshots),
        new NewStagePost(storage, clients, screenshots),
        new SplatfestPost('na', storage, clients, screenshots),
        new SplatfestPost('eu', storage, clients, screenshots),
        new SplatfestPost('jp', storage, clients, screenshots),
    ];
}
