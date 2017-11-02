<template>
    <Wrapper :title="title" :time="now">
        <div class="splatfest tilt-left" v-if="festival">
            <div class="hook-box">
                <SplatfestBox :festival="festival" :now="now" :screenshotMode="true" />
            </div>
        </div>
    </Wrapper>
</template>

<script>
import axios from 'axios';
import Wrapper from '@/js/components/screenshots/Wrapper.vue';
import SplatfestBox from '@/js/components/splatoon/SplatfestBox.vue';
import regions from '@/js/regions';

export default {
    components: { Wrapper, SplatfestBox },
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
        title() {
            let region = regions.splatoonRegions.find(r => r.key == this.region);
            return `Splatfest: ${region.name}`;
        },
        festival() {
            if (this.festivals)
                return this.festivals[this.region].festivals.find(f => f.times.start == this.startTime);
        },
    },
    created() {
        axios.get('data/festivals.json')
            .then(response => this.festivals = response.data)
    },
}
</script>
