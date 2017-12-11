<template>
    <div class="splatfest-results">
        <div class="background"></div>

        <div class="columns is-marginless is-gapless is-mobile results-header">
            <div class="title is-4 font-splatoon1 has-text-centered is-marginless results-header-text">
                {{ $t('splatfest.results.title') }}
            </div>

            <div class="column">
                <div class="image is-48x48" :title="$t(`splatnet.festivals.${festival.festival_id}.names.alpha_short`, festival.names.alpha_short)">
                    <img :src="festival.images.alpha | localSplatNetImageUrl" />
                </div>
            </div>

            <div class="column is-3">
                <!-- Intentionally left blank since "Results" doesn't quite fit the horizontal space -->
            </div>

            <div class="column">
                <div class="image is-48x48" :title="$t(`splatnet.festivals.${festival.festival_id}.names.bravo_short`, festival.names.bravo_short)">
                    <img :src="festival.images.bravo | localSplatNetImageUrl" />
                </div>
            </div>
        </div>

        <SplatfestResultsRow :festival="festival" :results="results" type="vote" />
        <SplatfestResultsRow :festival="festival" :results="results" type="solo" />
        <SplatfestResultsRow :festival="festival" :results="results" type="team" />
    </div>
</template>

<script>
import SplatfestResultsRow from './SplatfestResultsRow.vue';

export default {
    components: { SplatfestResultsRow },
    props: ['festival', 'results'],
}
</script>
