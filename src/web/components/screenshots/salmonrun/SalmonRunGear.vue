<template>
    <Wrapper title="Salmon Run Gear">
        <div class="tilt-left salmon-run-gear" style="display: flex; align-items: center; justify-content: center;" v-if="rewardGear">
            <MerchandiseBox :merchandise="merchandise" class="salmon-run-gear" />
        </div>
    </Wrapper>
</template>

<script>
import { mapGetters } from 'vuex';
import Wrapper from '@/web/components/screenshots/Wrapper.vue';
import MerchandiseBox from '@/web/components/splatoon/MerchandiseBox.vue';

export default {
    components: { Wrapper, MerchandiseBox },
    computed: {
        ...mapGetters('splatoon/salmonRun', ['rewardGear']),
        merchandise() {
            return { gear: this.rewardGear };
        },
    },
};
</script>
