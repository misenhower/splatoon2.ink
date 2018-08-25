<template>
    <Wrapper title="SplatNet Gear" v-if="merchandises">
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
                    class="featured-merchandise"
                    />
            </div>

            <div class="column" style="display: flex; align-items: center; justify-content: center;">
                <div class="columns is-multiline is-centered">
                    <div class="column is-one-third" v-for="(merchandise, index) in otherMerchandises" :key="index">
                        <MerchandiseBox
                            :merchandise="merchandise"
                            :class="(index % 2 == 0) ? 'tilt-right' : 'tilt-left'"
                            />
                    </div>
                </div>
            </div>
        </div>
    </Wrapper>
</template>

<script>
import Wrapper from '@/web/components/screenshots/Wrapper.vue';
import MerchandiseBox from '@/web/components/splatoon/MerchandiseBox.vue';

export default {
    components: { Wrapper, MerchandiseBox },
    computed: {
        merchandises() {
            return this.$store.getters['splatoon/splatNetStore/merchandises']
                && this.$store.getters['splatoon/splatNetStore/merchandises'].slice().reverse();
        },
        featuredMerchandise() {
            return this.merchandises && this.merchandises[0];
        },
        otherMerchandises() {
            return this.merchandises && this.merchandises.slice(1);
        },
    },
};
</script>
