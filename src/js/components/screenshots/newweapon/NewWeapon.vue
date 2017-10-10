<template>
    <Wrapper title="New Weapon" :time="releaseTime">
        <div class="new-weapon" v-if="newWeapon">
            <NewWeaponBox
                :weapon="newWeapon"
                title="Now Available"
                ></NewWeaponBox>
        </div>
    </Wrapper>
</template>

<script>
import axios from 'axios';
import Wrapper from '@/js/components/screenshots/Wrapper.vue';
import NewWeaponBox from '@/js/components/splatoon/NewWeaponBox.vue';

export default {
    components: { Wrapper, NewWeaponBox },
    props: ['releaseTime'],
    data() {
        return {
            timeline: null,
        };
    },
    computed: {
        newWeapon() {
            if (this.timeline && this.timeline.weapon_availability && this.timeline.weapon_availability.availabilities) {
                for (let availability of this.timeline.weapon_availability.availabilities) {
                    if (availability.release_time == this.releaseTime)
                        return availability.weapon;
                }
            }
        },
    },
    created() {
        axios.get('data/timeline.json')
            .then(response => this.timeline = response.data)
    },
}
</script>
