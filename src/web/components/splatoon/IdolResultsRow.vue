<template>
    <div class="columns is-mobile result">
        <div class="column">
            <div class="winner-mark-shadow" v-if="winner == 'alpha'"></div>
            <div class="winner-mark" style="background: #f2327b" v-if="winner == 'alpha'"></div>
            <div class="font-splatoon2 title is-4">
                <div>{{ heroWins.alpha }}</div>
            </div>
        </div>

        <div class="column is-5 has-text-centered font-splatoon2">
            <div style="margin: 0 -100px">
                {{ $t(`regions.${region}.name`) }}
            </div>
        </div>

        <div class="column">
            <div class="winner-mark-shadow" v-if="winner == 'bravo'"></div>
            <div class="winner-mark" style="background: #10dc85" v-if="winner == 'bravo'"></div>
            <div class="font-splatoon2 title is-4">
                <div>{{ heroWins.bravo }}</div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: ['region'],
    computed: {
        heroWins() {
            return this.$store.getters[`splatoon/splatfests/${this.region}/heroWins`];
        },
        winner() {
            if (this.heroWins.alpha > this.heroWins.bravo)
                return 'alpha';
            if (this.heroWins.bravo > this.heroWins.alpha)
                return 'bravo';
        },
    },
};
</script>
