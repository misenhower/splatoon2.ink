<template>
    <Wrapper title="Salmon Run">
        <div class="salmon-run tilt-left">
            <div class="hook-box">
                <SalmonRunBox
                    :useRelativeTime="true"
                    :showCurrent="showCurrent"
                    :showUpcoming="showUpcoming"
                    :showRewardGear="showRewardGear"
                    :hideUpcomingSchedulesWithoutDetails="true"
                    />
            </div>
        </div>
    </Wrapper>
</template>

<script>
import Wrapper from '@/web/components/screenshots/Wrapper.vue';
import SalmonRunBox from '@/web/components/splatoon/SalmonRunBox.vue';

export default {
    components: { Wrapper, SalmonRunBox },
    computed: {
        mode() {
            const mode = this.$route.query.mode;
            if (['current', 'upcoming'].indexOf(mode) !== -1) {
                return mode;
            }
            return 'current';
        },
        showCurrent() {
            return this.mode === 'current';
        },
        showUpcoming() {
            return this.mode === 'upcoming';
        },
        showRewardGear() {
            return this.mode === 'current';
        },
    },
};
</script>
