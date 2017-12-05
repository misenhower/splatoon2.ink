<template>
    <div class="columns is-mobile result">
        <div class="column">
            <div class="winner-mark" :style="{ background: festival.colors.alpha.css_rgb }" v-if="winner == 'alpha'"></div>
            <div class="font-splatoon1 title is-4">
                <div>{{ rates.alpha }}<span class="percent">{{ $t('splatfest.results.%') }}</span></div>
            </div>
        </div>

        <div class="column is-3 has-text-centered font-splatoon2">
            {{ title }}
        </div>

        <div class="column">
            <div class="winner-mark" :style="{ background: festival.colors.bravo.css_rgb }" v-if="winner == 'bravo'"></div>
            <div class="font-splatoon1 title is-4">
                <div>{{ rates.bravo }}<span class="percent">{{ $t('splatfest.results.%') }}</span></div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: ['festival', 'rates', 'title'],
    computed: {
        winner() {
            return (this.rates.alpha > this.rates.bravo) ? 'alpha' : 'bravo';
        },
        alphaStyle() {
            return { background: this.festival.colors.alpha };
        }
    },
}
</script>
