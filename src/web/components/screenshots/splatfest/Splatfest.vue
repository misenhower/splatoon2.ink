<template>
    <Wrapper :title="title" v-if="festival">
        <div class="level">
            <div class="level-item">
                <div class="splatfest tilt-left">
                    <div class="hook-box">
                        <SplatfestBox :festival="festival" screenshot-mode />
                    </div>
                </div>
            </div>

            <div class="level-item" v-if="festival.results">
                <SplatfestResultsBox :festival="festival" />
            </div>
        </div>
    </Wrapper>
</template>

<script>
import Wrapper from '@/web/components/screenshots/Wrapper.vue';
import SplatfestBox from '@/web/components/splatoon/SplatfestBox.vue';
import SplatfestResultsBox from '@/web/components/splatoon/SplatfestResultsBox.vue';
import { splatoonRegions } from '@/common/regions.esm';

export default {
    components: { Wrapper, SplatfestBox, SplatfestResultsBox },
    props: ['region'],
    computed: {
        festival() {
            return this.$store.getters[`splatoon/splatfests/${this.region}/currentSplatfest`];
        },
        regions() {
            let regions = this.$route.query.regions;
            if (regions)
                regions = regions.split(',');
            else
                regions = [this.region];

            return regions;
        },
        displayRegions() {
            if (this.regions.length === 3)
                return 'Global';
            return this.regions.map(region => splatoonRegions.find(r => r.key == region).demonym).join('/');
        },
        title() {
            return `${this.displayRegions} Splatfest`;
        },
    },
    created() {
        if (this.region === 'jp') {
            this.$i18n.add('ja', require('@/web/locale/ja'));
            this.$i18n.set('ja');
        }
    },
}
</script>
