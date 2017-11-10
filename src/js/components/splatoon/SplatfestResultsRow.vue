<template>
    <div class="level result">
        <div class="level-item">
            <div class="winner-mark" :style="{ background: festival.colors.alpha.css_rgb }" v-if="winner == 'alpha'"></div>
            <div class="font-splatoon1 title is-4">{{ rates.alpha }}%</div>
        </div>

        <div class="level-item">
            {{ title }}
        </div>

        <div class="level-item">
            <div class="winner-mark" :style="{ background: festival.colors.bravo.css_rgb }" v-if="winner == 'bravo'"></div>
            <div class="font-splatoon1 title is-4">{{ rates.bravo }}%</div>
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
