<template>
    <div class="font-splatoon2" :class="{ 'has-results': showingResults }">
        <div class="splatfest-header">
            <h2 class="title is-3 is-size-2-fullhd font-splatoon1">
                {{ title }}
            </h2>
        </div>

        <div class="panel-container" :class="{ 'is-hidden-mobile' : showingResults }">
            <div class="image panel-image">
                <img :src="image" />
            </div>

            <div class="regions">
                <span class="region" v-for="region in festival.regions" :key="region">
                    <span class="icon is-small">
                        <img :src="require(`@/web/assets/img/region-${region}.svg`)" />
                    </span>
                    <span>{{ region | upperCase }}</span>

                </span>
            </div>

            <div class="columns is-gapless labels is-hidden-mobile">
                <div class="column" v-text="teamNames.long.alpha"></div>
                <div class="column has-text-right" v-text="teamNames.long.bravo"></div>
            </div>

            <div class="columns is-gapless labels is-mobile is-hidden-tablet">
                <div class="column" v-text="teamNames.short.alpha"></div>
                <div class="column has-text-right" v-text="teamNames.short.bravo"></div>
            </div>

            <SplatfestResultsBox :festival="festival" v-if="showingResults" />
        </div>

        <div class="mobile-results is-hidden-tablet" v-if="showingResults">
            <SplatfestResultsBox :festival="festival" />
        </div>

        <div class="has-text-centered is-size-5 title-color festival-period-container">
            <div v-if="!showingResultsBar" class="festival-period" :style="{ 'background-color': festival.colors.middle.css_rgb }">
                <template v-if="!screenshotMode">
                    <span class="nowrap">
                        {{ festival.times.start | date(dateOptions) }}
                        {{ festival.times.start | time }}
                    </span>
                    &ndash;
                    <span class="nowrap">
                        {{ festival.times.end | date }}
                        {{ festival.times.end | time }}
                    </span>
                </template>
                <template v-else>
                    <template v-if="festival.state == 'upcoming'">
                        <template v-if="festival.times.start - now > 24 * 60 * 60">
                            {{ festival.times.start - now | shortDuration | time.in }}
                        </template>
                        <template v-else>
                            {{ festival.times.start - now | durationHours | time.in }}
                        </template>
                    </template>
                    <template v-else-if="festival.state == 'past' && !results && festival.times.result > now">
                        {{ festival.times.result - now | durationHours | resultsIn }}
                    </template>
                    <template v-else>
                        {{ festival.times.end - now | durationHours | time.remaining }}
                    </template>
                </template>
            </div>

            <SplatfestWinnerBar :festival="festival" v-else />
        </div>

        <div class="splatfest-content has-text-centered" v-if="!screenshotMode">
            <template v-if="festival.state == 'upcoming'">
                {{ festival.times.start - now | duration | time.in }}
            </template>

            <template v-else-if="festival.state == 'active'">
                {{ festival.times.end - now | duration | time.remaining }}
            </template>

            <template v-else-if="festival.state == 'past' && !festival.results && festival.times.result > now">
                {{ festival.times.result - now | duration | resultsIn }}
            </template>
        </div>
    </div>
</template>

<script>
import Vue from 'vue';
import { mapGetters } from 'vuex';
import SplatfestResultsBox from './SplatfestResultsBox.vue';
import SplatfestWinnerBar from './SplatfestWinnerBar.vue';

export default {
    components: { SplatfestResultsBox, SplatfestWinnerBar },
    props: {
        festival: null,
        screenshotMode: Boolean,
        historyMode: Boolean,
    },
    filters: {
        resultsIn(time) {
            return Vue.i18n.translate('splatfest.results_in', { time });
        },
    },
    computed: {
        ...mapGetters('splatoon', ['now']),
        showingResults() {
            return this.festival.results && !this.screenshotMode && !this.historyMode;
        },
        showingResultsBar() {
            return this.showingResults || (this.festival.results && this.screenshotMode);
        },
        dateOptions() {
            if (this.historyMode)
                return { year: 'numeric' };
            return { weekday: 'short' };
        },
        title() {
            if (this.festival.state == 'upcoming')
                return this.$t('splatfest.upcoming');
            if (this.festival.state == 'past' && !this.screenshotMode)
                return this.$t('splatfest.recent');
            return this.$t('splatfest.title');
        },
        image() {
            if (this.festival)
                return Vue.filter('localSplatNetImageUrl')(this.festival.images.panel);
        },
        teamNames() {
            return {
                long: {
                    alpha: this.$t(`splatnet.festivals.${this.festival.festival_id}.names.alpha_long`, this.festival.names.alpha_long),
                    bravo: this.$t(`splatnet.festivals.${this.festival.festival_id}.names.bravo_long`, this.festival.names.bravo_long),
                },
                short: {
                    alpha: this.$t(`splatnet.festivals.${this.festival.festival_id}.names.alpha_short`, this.festival.names.alpha_short),
                    bravo: this.$t(`splatnet.festivals.${this.festival.festival_id}.names.bravo_short`, this.festival.names.bravo_short),
                },
            };
        },
    },
}
</script>
