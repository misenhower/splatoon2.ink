<template>
    <div class="columns is-mobile result">
        <div class="column">
            <div class="winner-mark-shadow" v-if="winner == 'alpha'"></div>
            <div class="winner-mark" :style="{ background: festival.colors.alpha.css_rgb }" v-if="winner == 'alpha'"></div>
            <div class="font-splatoon2 title is-4" :title="alphaTitle | numberFormat">
                <div>{{ rates.alpha | wholePercent }}<span class="percent">.{{ rates.alpha | partialPercent }}{{ $t('splatfest.results.%') }}</span></div>
            </div>
        </div>

        <div class="column is-3 has-text-centered font-splatoon2">
            {{ $t(`splatfest.results.${type}`) }}
        </div>

        <div class="column">
            <div class="winner-mark-shadow" v-if="winner == 'bravo'"></div>
            <div class="winner-mark" :style="{ background: festival.colors.bravo.css_rgb }" v-if="winner == 'bravo'"></div>
            <div class="font-splatoon2 title is-4" :title="bravoTitle | numberFormat">
                <div>{{ rates.bravo | wholePercent }}<span class="percent">.{{ rates.bravo | partialPercent }}{{ $t('splatfest.results.%') }}</span></div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: ['festival', 'type'],
    computed: {
        winner() {
            return this.festival.results.summary[this.type] ? 'bravo' : 'alpha';
        },
        alphaTitle() {
            return this.resultTitle('alpha');
        },
        bravoTitle() {
            return this.resultTitle('bravo');
        },
        rates() {
            return this.festival.results.rates[this.type];
        },
    },
    filters: {
        wholePercent(value) {
            return value.toString().slice(0, -2);
        },
        partialPercent(value) {
            return value.toString().slice(-2);
        },
    },
    methods: {
        resultTitle(team) {
            if (this.type == 'vote')
                return this.festival.results.team_participants && this.festival.results.team_participants[team];
            return this.festival.results.team_scores && this.festival.results.team_scores[`${team}_${this.type}`];
        },
    },
}
</script>
