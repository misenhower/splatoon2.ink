<template>
    <div class="font-splatoon2">
        <div class="splatfest-header">
            <h2 class="title is-3 is-size-2-fullhd font-splatoon1">
                {{ title }}
            </h2>
        </div>

        <div class="panel-container">
            <div class="image">
                <img :src="image" />
            </div>

            <div class="labels">
                <div class="alpha">
                    {{ festival.names.alpha_short }}
                </div>

                <div class="bravo">
                    {{ festival.names.bravo_short }}
                </div>
            </div>

            <SplatfestResultsBox :festival="festival" :results="results" v-if="results && !screenshotMode" />
        </div>

        <div class="has-text-centered is-size-5 title-color festival-period-container" v-if="!screenshotMode">
            <span class="festival-period" :style="{ 'background-color': festival.colors.middle.css_rgb }">
                {{ festival.times.start | date }}
                {{ festival.times.start | time }}
                &ndash;
                {{ festival.times.end | date }}
                {{ festival.times.end | time }}
            </span>
        </div>

        <div class="splatfest-content has-text-centered" v-if="!screenshotMode">
            <template v-if="state == 'upcoming'">
                in
                {{ festival.times.start - now | duration }}
            </template>

            <template v-else-if="state == 'active'">
                {{ festival.times.end - now | duration }}
                remaining
            </template>

            <template v-else-if="state == 'past' && !results && festival.times.result > now">
                results in
                {{ festival.times.result - now | duration }}
            </template>
        </div>

        <div class="has-text-centered is-size-5 title-color festival-period-container" v-if="screenshotMode">
            <span class="festival-period" :style="{ 'background-color': festival.colors.middle.css_rgb }">
                {{ festival.times.end - now | durationHours }} remaining
            </span>
        </div>
    </div>
</template>

<script>
import Vue from 'vue';
import SplatfestResultsBox from './SplatfestResultsBox.vue';

export default {
    components: { SplatfestResultsBox },
    props: ['festival', 'results', 'now', 'screenshotMode'],
    computed: {
        state() {
            if (this.festival.times.start > this.now)
                return 'upcoming';
            if (this.festival.times.end > this.now)
                return 'active';
            return 'past';
        },
        title() {
            switch (this.state) {
                case 'upcoming': return 'Upcoming Splatfest';
                case 'active':   return 'Splatfest';
                case 'past':     return 'Recent Splatfest';
            }
        },
        image() {
            if (this.festival)
                return Vue.filter('localSplatNetImageUrl')(this.festival.images.panel);
        },
    }
}
</script>
