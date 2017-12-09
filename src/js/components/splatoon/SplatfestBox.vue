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
                    {{ teamNames.alpha }}
                </div>

                <div class="bravo">
                    {{ teamNames.bravo }}
                </div>
            </div>

            <SplatfestResultsBox :festival="festival" :results="results" v-if="results && !screenshotMode" />
        </div>

        <div class="mobile-results is-hidden-tablet" v-if="results">
            <SplatfestResultsBox :festival="festival" :results="results" v-if="results && !screenshotMode" />
        </div>

        <div class="has-text-centered is-size-5 title-color festival-period-container">
            <div v-if="!results" class="festival-period" :style="{ 'background-color': festival.colors.middle.css_rgb }">
                <template v-if="!screenshotMode">
                    <span class="nowrap">
                        {{ festival.times.start | date({ weekday: 'short' }) }}
                        {{ festival.times.start | time }}
                    </span>
                    &ndash;
                    <span class="nowrap">
                        {{ festival.times.end | date }}
                        {{ festival.times.end | time }}
                    </span>
                </template>
                <template v-else>
                    <template v-if="state == 'upcoming'">
                        {{ festival.times.start - now | shortDuration | time.in }}
                    </template>
                    <template v-else>
                        {{ festival.times.end - now | durationHours | time.remaining }}
                    </template>
                </template>
            </div>

            <div v-else class="festival-period" style="background-color: #333" v-html="teamWins"></div>
        </div>

        <div class="splatfest-content has-text-centered" v-if="!screenshotMode">
            <template v-if="state == 'upcoming'">
                {{ festival.times.start - now | duration | time.in }}
            </template>

            <template v-else-if="state == 'active'">
                {{ festival.times.end - now | duration | time.remaining }}
            </template>

            <template v-else-if="state == 'past' && !results && festival.times.result > now">
                {{ festival.times.result - now | duration | resultsIn }}
            </template>
        </div>
    </div>
</template>

<script>
import Vue from 'vue';
import SplatfestResultsBox from './SplatfestResultsBox.vue';

export default {
    components: { SplatfestResultsBox },
    props: ['festival', 'results', 'now', 'screenshotMode'],
    filters: {
        resultsIn(time) {
            return Vue.i18n.translate('splatfest.results_in', { time });
        },
    },
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
                return this.$t('splatfest.upcoming');
            if (this.state == 'past' && !this.screenshotMode)
                return this.$t('splatfest.recent');
            return this.$t('splatfest.title');
        },
        image() {
            if (this.festival)
                return Vue.filter('localSplatNetImageUrl')(this.festival.images.panel) + '?1';
        },
        teamNames() {
            return {
                alpha: this.$t(`splatnet.festivals.${this.festival.festival_id}.names.alpha_short`, this.festival.names.alpha_short),
                bravo: this.$t(`splatnet.festivals.${this.festival.festival_id}.names.bravo_short`, this.festival.names.bravo_short),
            };
        },
        teamWins() {
            if (!this.results)
                return;

            // Which team won?
            let points = { alpha: 0, bravo: 0 };
            for (let key of ['vote', 'solo', 'team']) {
                let rates = this.results.rates[key];
                let winner = (rates.alpha > rates.bravo) ? 'alpha' : 'bravo';
                points[winner]++;
            }

            let winner = (points.alpha > points.bravo) ? 'alpha' : 'bravo';

            let team = `<span style="color: ${this.festival.colors[winner].css_rgb}">${this.teamNames[winner]}</span>`;
            return this.$t('splatfest.team_name_wins', { team });
        },
    },
}
</script>
