<template>
    <Wrapper title="Salmon Run Gear" :time="now">
        <div class="tilt-left salmon-run-gear" style="display: flex; align-items: center; justify-content: center;" v-if="merchandise">
            <MerchandiseBox :merchandise="merchandise" />
        </div>
    </Wrapper>
</template>

<script>
import axios from 'axios';
import Wrapper from '@/js/components/screenshots/Wrapper.vue';
import MerchandiseBox from '@/js/components/splatoon/MerchandiseBox.vue';

export default {
    components: { Wrapper, MerchandiseBox },
    props: ['now'],
    data() {
        return {
            timeline: null,
        };
    },
    computed: {
        merchandise() {
            if (this.timeline)
                return { gear: this.timeline.coop.reward_gear.gear };
        },
    },
    created() {
        axios.get('data/timeline.json')
            .then(response => this.timeline = response.data)
    },
}
</script>
