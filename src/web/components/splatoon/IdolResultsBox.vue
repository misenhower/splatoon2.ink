<template>
    <div class="splatfest-results">
        <div class="background"></div>

        <div class="title is-4 font-splatoon1 has-text-centered is-marginless results-header is-hidden-mobile">
            {{ $t('splatfest.results.title') }}
        </div>

        <div class="columns is-marginless is-gapless is-mobile results-header is-hidden-tablet">
            <div class="title is-4 font-splatoon1 has-text-centered is-marginless results-header-text">
                {{ $t('splatfest.results.title') }}
            </div>

            <div class="column">
                <div class="image is-48x48">
                    <img src="~@/web/assets/img/pearl.png" style="margin: auto; width: 29px; height: 48px;" />
                </div>
            </div>

            <div class="column is-5">
                <!-- Intentionally left blank since "Results" doesn't quite fit the horizontal space -->
            </div>

            <div class="column">
                <div class="image is-48x48">
                    <img src="~@/web/assets/img/marina.png" style="margin: auto; width: 24px; height: 48px;" />
                </div>
            </div>
        </div>

        <IdolResultsRow region="na" />
        <IdolResultsRow region="eu" />
        <IdolResultsRow region="jp" />
    </div>
</template>

<script>
import IdolResultsRow from './IdolResultsRow.vue';

export default {
    components: { IdolResultsRow },
};
</script>
