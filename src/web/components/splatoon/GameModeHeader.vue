<template>
    <div class="level">
        <div class="level-left">
            <div class="level-item">
                <div class="image is-48x48" style="margin-bottom: -6px">
                    <img v-if="mode === 'regular'" src="~@/web/assets/img/battle-regular.png" />
                    <img v-if="mode === 'ranked'" src="~@/web/assets/img/battle-ranked.png" />
                    <img v-if="mode === 'league'" src="~@/web/assets/img/battle-league.png" />
                </div>
            </div>
            <div class="level-item">
                <h2 class="title is-3 is-size-2-fullhd is-size-4-mobile font-splatoon1">
                    <template>{{ name }}</template>
                </h2>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    props: ['mode'],
    computed: {
        ...mapGetters('splatoon/splatfests', ['selectedRegionHasActiveSplatfest']),
        name() {
            if (this.selectedRegionHasActiveSplatfest)
                return this.$t('splatfest.battle');

            return this.$t(`game_mode.${this.mode}`);
        },
    },
}
</script>
