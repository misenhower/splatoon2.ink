<template>
    <Wrapper :title="title" :time="now">
        <div class="level">
            <div class="level-item">
                <div class="splatfest tilt-left" v-if="festival">
                    <div class="hook-box">
                        <SplatfestBox :festival="festival" :now="now" :results="results" :screenshotMode="true" />
                    </div>
                </div>
            </div>

            <div class="level-item" v-if="results">
                <SplatfestResultsBox :festival="festival" :results="results" />
            </div>
        </div>
    </Wrapper>
</template>

<script>
import axios from 'axios';
import Wrapper from '@/web/components/screenshots/Wrapper.vue';
import SplatfestBox from '@/web/components/splatoon/SplatfestBox.vue';
import SplatfestResultsBox from '@/web/components/splatoon/SplatfestResultsBox.vue';
import { splatoonRegions } from '@/common/regions.esm';

export default {
    components: { Wrapper, SplatfestBox, SplatfestResultsBox },
    props: ['region', 'startTime'],
    data() {
        return {
            festivals: null,
        };
    },
    computed: {
        now() {
            return this.startTime;
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
        festival() {
            if (this.festivals)
                return this.festivals[this.region].festivals.find(f => f.times.announce <= this.now && f.times.result >= this.now);
        },
        results() {
            if (this.festival)
                return this.festivals[this.region].results.find(r => r.festival_id == this.festival.festival_id);
        },
    },
    created() {
        if (this.region == 'jp') {
            this.$i18n.add('ja', require('@/web/locale/ja'));
            this.$i18n.set('ja');
        }

        axios.get('data/festivals.json')
            .then(response => this.festivals = response.data)
    },
}
</script>
