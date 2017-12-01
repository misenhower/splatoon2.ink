<template>
    <div class="font-splatoon2" :class="{ 'has-results': results }">
        <div class="splatfest-header">
            <h2 class="title is-3 is-size-2-fullhd font-splatoon1">
                {{ title }}
            </h2>
        </div>

        <div class="panel-container" :class="{ 'is-hidden-mobile' : results }">
            <div class="image panel-image">
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

        <div class="mobile-results is-hidden-tablet" v-if="results">
            <SplatfestResultsBox :festival="festival" :results="results" v-if="results && !screenshotMode" />
        </div>

        <div class="has-text-centered is-size-5 title-color festival-period-container" v-if="!screenshotMode">
            <div class="festival-period" :style="{ 'background-color': festival.colors.middle.css_rgb }">
                <span class="nowrap">
                    {{ festival.times.start | date({ weekday: 'short' }) }}
                    {{ festival.times.start | time }}
                </span>
                &ndash;
                <span class="nowrap">
                    {{ festival.times.end | date }}
                    {{ festival.times.end | time }}
                </span>
            </div>
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
            <div class="festival-period" :style="{ 'background-color': festival.colors.middle.css_rgb }" v-if="state == 'upcoming'">
                in {{ festival.times.start - now | shortDuration }}
            </div>
            <div class="festival-period" :style="{ 'background-color': festival.colors.middle.css_rgb }" v-else-if="state == 'active'">
                {{ festival.times.end - now | durationHours }} remaining
            </div>
            <div v-else>&nbsp;</div>
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
            if (this.state == 'upcoming')
                return 'Upcoming Splatfest';
            if (this.state == 'past' && !this.screenshotMode)
                return 'Recent Splatfest';
            return 'Splatfest';
        },
        image() {
            if (this.festival)
                return Vue.filter('localSplatNetImageUrl')(this.festival.images.panel);
        },
    }
}
</script>
