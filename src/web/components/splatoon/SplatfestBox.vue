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
        <span v-for="(data, region) in festival.regions" :key="region" class="region">
          <span class="icon is-small">
            <img :src="require(`@/web/assets/img/region-${region}.svg`)" />
          </span>
          <span>{{ region | upperCase }}</span>

        </span>
      </div>

      <div class="columns is-gapless labels is-hidden-mobile">
        <div class="column" v-text="teamNames.long.alpha" />
        <div class="column has-text-right" v-text="teamNames.long.bravo" />
      </div>

      <div class="columns is-gapless labels is-mobile is-hidden-tablet">
        <div class="column" v-text="teamNames.short.alpha" />
        <div class="column has-text-right" v-text="teamNames.short.bravo" />
      </div>

      <SplatfestResultsBox v-if="showingResults" :festival="festival" />
    </div>

    <div v-if="showingResults" class="mobile-results is-hidden-tablet">
      <SplatfestResultsBox :festival="festival" />
    </div>

    <div v-if="!globalSplatfestMode" class="has-text-centered is-size-5 title-color festival-period-container">
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

      <SplatfestWinnerBar v-else :festival="festival" />
    </div>

    <div v-if="!screenshotMode && !globalSplatfestMode" class="splatfest-content has-text-centered">
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

    <!-- Spacer at the bottom -->
    <div v-if="globalSplatfestMode">
&nbsp;
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
    filters: {
        resultsIn(time) {
            return Vue.i18n.translate('splatfest.results_in', { time });
        },
    },
    props: {
        festival: null,
        screenshotMode: Boolean,
        historyMode: Boolean,
        globalSplatfestMode: Boolean,
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
            if (this.globalSplatfestMode)
                return this.$t('splatfest.global');
            if (this.festival.state == 'upcoming')
                return this.$t('splatfest.upcoming');
            if (this.festival.state == 'past' && !this.screenshotMode)
                return this.$t('splatfest.recent');
            return this.$t('splatfest.title');
        },
        image() {
            if (this.festival)
                return Vue.filter('localSplatNetImageUrl')(this.festival.images.panel);
            return null;
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
};
</script>
