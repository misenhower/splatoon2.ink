<template>
    <Wrapper :title="title" :time="releaseTime">
        <div :class="{ 'new-weapons-large': newWeapons.length <= 3 }" v-if="newWeapons">
            <div style="display: flex; align-items: center; justify-content: center;">
                <div v-for="(weapon, index) in newWeapons" style="margin: 0 20px">
                    <NewWeaponBox
                        :weapon="weapon"
                        :class="(index % 2 == 0) ? 'tilt-left' : 'tilt-right'"
                        title="Now Available"
                        ></NewWeaponBox>
                </div>
            </div>
        </div>
    </Wrapper>
</template>

<script>
import axios from 'axios';
import Wrapper from '@/web/components/screenshots/Wrapper.vue';
import NewWeaponBox from '@/web/components/splatoon/NewWeaponBox.vue';

export default {
    components: { Wrapper, NewWeaponBox },
    props: ['releaseTime'],
    data() {
        return {
            timeline: null,
        };
    },
    computed: {
        newWeapons() {
            if (this.timeline && this.timeline.weapon_availability && this.timeline.weapon_availability.availabilities) {
                let weapons = this.timeline.weapon_availability.availabilities
                    .filter(a => a.release_time == this.releaseTime)
                    .map(a => a.weapon);

                if (weapons.length > 0)
                    return weapons;
            }
        },
        title() {
            if (this.newWeapons && this.newWeapons.length == 1)
                return 'New Weapon';
            return 'New Weapons';
        },
    },
    created() {
        axios.get('data/timeline.json')
            .then(response => this.timeline = response.data)
    },
}
</script>
