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
                        <router-link :to="`/splatNetGear/${topOfHour}/${latestGear.end_time}`">
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
                            :to="`/splatfest/${splatfest.region}/${splatfest.festival.times.start}`">
                            {{ splatfest.region }}
                        </router-link>
                    </strong>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    data() {
        return {
            schedules: null,
            merchandises: null,
            timeline: null,
            salmonruncalendar: null,
            festivals: null,
        };
    },
    computed: {
        topOfHour() {
            let date = new Date;
            date.setUTCMinutes(0);
            date.setUTCSeconds(0);
            return Math.floor(date.getTime() / 1000);
        },
        latestSchedule() {
            if (this.schedules)
                return this.schedules.regular[0];
        },
        latestGear() {
            if (this.merchandises)
                return this.merchandises[this.merchandises.length - 1];
        },
        latestSalmonRun() {
            if (this.salmonruncalendar)
                return this.salmonruncalendar.schedules[0];

            if (this.timeline && this.timeline.coop)
                return this.timeline.coop;
        },
        newWeaponAvailability() {
            if (this.timeline && this.timeline.weapon_availability && this.timeline.weapon_availability.availabilities) {
                return this.timeline.weapon_availability.availabilities[0];
            }
        },
        splatfests() {
            if (this.festivals) {
                let splatfests = [];

                for (let region in this.festivals) {
                    let festival = this.festivals[region].festivals[0];
                    if (festival)
                        splatfests.push({ region, festival });
                }

                if (splatfests.length)
                    return splatfests;
            }
        },
    },
    created() {
        axios.get('data/schedules.json')
            .then(response => this.schedules = response.data);
        axios.get('data/merchandises.json')
            .then(response => this.merchandises = response.data.merchandises);
        axios.get('data/timeline.json')
            .then(response => this.timeline = response.data);
        axios.get('data/salmonruncalendar.json')
            .then(response => this.salmonruncalendar = response.data);
        axios.get('data/festivals.json')
            .then(response => this.festivals = response.data);
    },
}
</script>
