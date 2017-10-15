<template>
    <Wrapper title="SplatNet Gear" :time="startTime" v-if="merchandises">
        <div class="columns">
            <div class="column is-5">
                <h1 class="title is-3 font-splatoon2 has-text-centered">New Gear</h1>
            </div>
            <div class="column" style="display: flex; align-items: center; justify-content: center;">
                <h1 class="title is-4 font-splatoon2 has-text-centered">Still Available</h1>
            </div>
        </div>

        <div class="columns">
            <div class="column is-5" style="min-height: 560px; display: flex; align-items: center; justify-content: center;">
                <MerchandiseBox
                    :merchandise="featuredMerchandise"
                    :now="startTime"
                    class="featured-merchandise"
                    ></MerchandiseBox>
            </div>

            <div class="column" style="display: flex; align-items: center; justify-content: center;">
                <div class="columns is-multiline is-centered">
                    <div class="column is-one-third" v-for="(merchandise, index) in otherMerchandises">
                        <MerchandiseBox
                            :merchandise="merchandise"
                            :now="startTime"
                            :class="(index % 2 == 0) ? 'tilt-right' : 'tilt-left'"
                            ></MerchandiseBox>
                    </div>
                </div>
            </div>
        </div>
    </Wrapper>
</template>

<script>
import axios from 'axios';
import Wrapper from '@/js/components/screenshots/Wrapper.vue';
import MerchandiseBox from '@/js/components/splatoon/MerchandiseBox.vue';

export default {
    components: { Wrapper, MerchandiseBox },
    props: ['startTime', 'endTime'],
    data() {
        return {
            merchandises: null,
        };
    },
    computed: {
        featuredMerchandise() {
            if (this.merchandises)
                return this.merchandises.find(m => m.end_time == this.endTime);
        },
        otherMerchandises() {
            if (this.merchandises) {
                return this.merchandises
                    .filter(m => m != this.featuredMerchandise && m.end_time > this.startTime)
                    .sort((a, b) => b.end_time - a.end_time);
            }
        },
    },
    created() {
        axios.get('data/merchandises.json')
            .then(response => this.merchandises = response.data.merchandises)
    },
}
</script>
