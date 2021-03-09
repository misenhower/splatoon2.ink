<template>
    <div v-if="schedule" :class="mode">
        <h3 class="title is-2 font-splatoon1 has-text-centered">
            <template v-if="splatfestBattle">{{ $t('splatfest.battle') }}</template>
            <template v-else>{{ schedule.game_mode.name }}</template>
        </h3>

        <h5 class="subtitle is-3 font-splatoon2 has-text-centered" style="margin-top: -1rem" v-if="!splatfestBattle">
            <div class="image is-48x48" style="margin-bottom: -12px; display: inline-block">
                <img v-if="schedule.game_mode.key == 'regular'" src="~@/web/assets/img/battle-regular.png" />
                <img v-if="schedule.game_mode.key == 'gachi'" src="~@/web/assets/img/battle-ranked.png" />
                <img v-if="schedule.game_mode.key == 'league'" src="~@/web/assets/img/battle-league.png" />
            </div>

            {{ schedule.rule.name }}
        </h5>

        <div v-if="splatfestBattle && currentSplatfest">
            <div class="columns">
                <div class="column">
                    <Stage :stage="schedule.stage_a" />
                </div>
                <div class="column">
                    <Stage :stage="schedule.stage_b" />
                </div>
            </div>

            <div class="columns">
                <div class="column is-half is-offset-one-quarter">
            <Stage v-if="splatfestBattle && currentSplatfest" :stage="currentSplatfest.special_stage" />
                </div>
            </div>
        </div>
        <div v-else>
            <Stage :stage="schedule.stage_a" />
            <Stage :stage="schedule.stage_b" />
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Stage from '@/web/components/splatoon/Stage.vue';

export default {
    components: { Stage },
    props: {
        mode: null,
        splatfestBattle: Boolean,
    },
    computed: {
        ...mapGetters('splatoon/splatfests/na', ['currentSplatfest']),
        schedule() {
            return this.$store.getters[`splatoon/schedules/${this.mode}/activeSchedule`];
        },
    },
}
</script>
