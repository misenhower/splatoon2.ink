<template>
  <div class="festival-period" style="background-color: #333">
    <span v-if="winner">{{ winnerText.before }}<span :style="{ color: winnerColor }">{{ teamNames[winner] }}</span>{{ winnerText.after }}</span>
  </div>
</template>

<script>
export default {
    props: {
        festival: Object,
    },
    computed: {
        teamNames() {
            return {
                alpha: this.$t(`splatnet.festivals.${this.festival.festival_id}.names.alpha_short`, this.festival.names.alpha_short),
                bravo: this.$t(`splatnet.festivals.${this.festival.festival_id}.names.bravo_short`, this.festival.names.bravo_short),
            };
        },
        winner() {
            if (!this.festival || !this.festival.results)
                return null;

            return this.festival.results.summary.total ? 'bravo' : 'alpha';
        },
        winnerColor() {
            return this.festival.colors[this.winner].css_rgb;
        },
        // The translated sentence split around the team name, e.g. "Team " / " wins!"
        winnerText() {
            const placeholder = '\u0000';
            const [before, after] = this.$t('splatfest.team_name_wins', { team: placeholder }).split(placeholder);
            return { before, after };
        },
    },
};
</script>
