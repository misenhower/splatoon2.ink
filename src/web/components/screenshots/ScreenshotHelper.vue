<template>
    <div class="hero is-fullheight">
        <div class="hero-body">
            <div class="container has-text-centered">
                <div v-if="latestSchedule">
                    <strong>
                        <router-link :to="`/schedules/${latestSchedule.start_time}`">
                            Map Schedules
                        </router-link>
                    </strong>
                </div>

                <div v-if="latestGear">
                    <strong>
                        <router-link :to="`/splatNetGear/${latestGearTime}`">
                            SplatNet Gear
                        </router-link>
                    </strong>
                </div>

                <div v-if="latestSalmonRun">
                    <strong>
                        <router-link :to="`/salmonRun/${latestSalmonRun.start_time}`">
                            Salmon Run
                        </router-link>
                    </strong>
                </div>

                <div v-if="salmonRunGear">
                    <strong>
                        <router-link :to="`/salmonRunGear/${salmonRunGear.available_time}`">
                            Salmon Run Gear
                        </router-link>
                    </strong>
                </div>

                <div v-if="newWeaponAvailability">
                    <strong>
                        <router-link :to="`/newWeapon/${newWeaponAvailability.release_time}`">
                            New Weapon
                        </router-link>
                    </strong>
                </div>

                <div v-if="splatfests">
                    Splatfest:
                    <strong>
                        <router-link
                            v-for="splatfest in splatfests"
                            :key="splatfest.region"
                            :to="`/splatfest/${splatfest.region}/${splatfest.time}`">
                            {{ splatfest.region }}
                        </router-link>
                    </strong>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    computed: {
        latestSchedule() {
            return this.$store.state.splatoon.data.schedules
                && this.$store.state.splatoon.data.schedules.regular[0];
        },
        latestGear() {
            return this.$store.state.splatoon.data.merchandises
                && this.$store.state.splatoon.data.merchandises.merchandises[0];
        },
        latestGearTime() {
            return this.latestGear && this.latestGear.end_time - (2 * 60 * 60); // 2 hours
        },
        latestSalmonRun() {
            return this.$store.state.splatoon.data.coop_schedules
                && this.$store.state.splatoon.data.coop_schedules.schedules[0];
        },
        salmonRunGear() {
            return this.$store.state.splatoon.data.timeline
                && this.$store.state.splatoon.data.timeline.coop.reward_gear;
        },
        newWeaponAvailability() {
            return this.$store.state.splatoon.data.timeline
                && this.$store.state.splatoon.data.timeline.weapon_availability
                && this.$store.state.splatoon.data.timeline.weapon_availability.availabilities[0];
        },
        splatfests() {
            if (this.$store.state.splatoon.data.festivals) {
                return ['na', 'eu', 'jp'].map(region => ({
                    region,
                    time: this.$store.state.splatoon.data.festivals[region].festivals[0].times.start,
                }));
            }
            return null;
        },
    },
};
</script>
