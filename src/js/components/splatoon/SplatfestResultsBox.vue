<template>
    <div class="splatfest-results">
        <div class="background"></div>

        <div class="columns is-marginless is-gapless is-mobile results-header">
            <div class="title is-4 font-splatoon1 has-text-centered is-marginless results-header-text">Results</div>

            <div class="column">
                <div class="image is-48x48" :title="festival.names.alpha_short">
                    <img :src="festival.images.alpha | localSplatNetImageUrl" />
                </div>
            </div>

            <div class="column is-3">
                <!-- Intentionally left blank since "Results" doesn't quite fit the horizontal space -->
            </div>

            <div class="column">
                <div class="image is-48x48" :title="festival.names.bravo_short">
                    <img :src="festival.images.bravo | localSplatNetImageUrl" />
                </div>
            </div>
        </div>

        <SplatfestResultsRow title="Votes" :festival="festival" :rates="results.rates.vote" />
        <SplatfestResultsRow title="Solo" :festival="festival" :rates="results.rates.solo" />
        <SplatfestResultsRow title="Team" :festival="festival" :rates="results.rates.team" />
    </div>
</template>

<script>
import SplatfestResultsRow from './SplatfestResultsRow.vue';

export default {
    components: { SplatfestResultsRow },
    props: ['festival', 'results'],
}
</script>
