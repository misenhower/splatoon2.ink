<template>
    <Wrapper :title="title">
        <div :class="{ 'new-weapons-large': weapons.length <= 3 }" v-if="weapons">
            <NewWeaponsContainer title="Now Available" />
        </div>
    </Wrapper>
</template>

<script>
import { mapGetters } from 'vuex';
import Wrapper from '@/web/components/screenshots/Wrapper.vue';
import NewWeaponsContainer from '@/web/components/splatoon/NewWeaponsContainer.vue';

export default {
    components: { Wrapper, NewWeaponsContainer },
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
