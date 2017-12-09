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
import Wrapper from '@/js/components/screenshots/Wrapper.vue';
import SplatfestBox from '@/js/components/splatoon/SplatfestBox.vue';
import SplatfestResultsBox from '@/js/components/splatoon/SplatfestResultsBox.vue';
import regions from '@/js/regions';

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
        regionInfo() {
            return regions.splatoonRegions.find(r => r.key == this.region);
        },
        title() {
            if (this.results)
                return `${this.regionInfo.demonym} Splatfest Results`;
            return `${this.regionInfo.demonym} Splatfest`;
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
        axios.get('data/festivals.json')
            .then(response => this.festivals = response.data)
    },
}
</script>
