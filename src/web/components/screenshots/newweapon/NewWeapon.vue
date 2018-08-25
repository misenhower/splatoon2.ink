<template>
    <Wrapper :title="title">
        <div :class="{ 'new-weapons-large': weapons.length <= 3 }" v-if="weapons">
            <div style="display: flex; align-items: center; justify-content: center;">
                <div v-for="(weapon, index) in weapons" style="margin: 0 20px" :key="index">
                    <NewWeaponBox
                        :weapon="weapon"
                        :class="(index % 2 == 0) ? 'tilt-left' : 'tilt-right'"
                        title="Now Available"
                        />
                </div>
            </div>
        </div>
    </Wrapper>
</template>

<script>
import { mapGetters } from 'vuex';
import Wrapper from '@/web/components/screenshots/Wrapper.vue';
import NewWeaponBox from '@/web/components/splatoon/NewWeaponBox.vue';

export default {
    components: { Wrapper, NewWeaponBox },
    computed: {
        ...mapGetters('splatoon/newWeapons', ['weapons']),
        title() {
            if (this.weapons && this.weapons.length == 1)
                return 'New Weapon';
            return 'New Weapons';
        },
    },
};
</script>
