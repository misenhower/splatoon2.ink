<template>
    <div class="festival-period" style="background-color: #333" v-html="teamWins"></div>
</template>

<script>
export default {
    props: ['festival', 'results'],
    computed: {
        teamNames() {
            return {
                alpha: this.$t(`splatnet.festivals.${this.festival.festival_id}.names.alpha_short`, this.festival.names.alpha_short),
                bravo: this.$t(`splatnet.festivals.${this.festival.festival_id}.names.bravo_short`, this.festival.names.bravo_short),
            };
        },
        teamWins() {
            if (!this.festival || !this.results)
                return;

                console.log(this.festival,this.results)

            let winner = this.results.summary.total ? 'bravo' : 'alpha';

            let team = `<span style="color: ${this.festival.colors[winner].css_rgb}">${this.teamNames[winner]}</span>`;
            return this.$t('splatfest.team_name_wins', { team });
        },
    },
}
</script>
