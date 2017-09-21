<template>
    <div v-if="schedule">
        <h3 class="title is-3 font-splatoon1 has-text-centered">
            {{ schedule.game_mode.name }}
        </h3>

        <h5 class="subtitle is-4 font-splatoon2 has-text-centered" style="margin-top: -1rem">
            <div class="image is-32x32" style="margin-bottom: -8px; display: inline-block">
                <img v-if="schedule.game_mode.key == 'regular'" src="~@/img/battle-regular.png" />
                <img v-if="schedule.game_mode.key == 'gachi'" src="~@/img/battle-ranked.png" />
                <img v-if="schedule.game_mode.key == 'league'" src="~@/img/battle-league.png" />
            </div>

            {{ schedule.rule.name }}
        </h5>

        <Stage :stage="schedule.stage_a"></Stage>
        <Stage :stage="schedule.stage_b"></Stage>
    </div>
</template>

<script>
import Stage from '@/js/components/splatoon/Stage.vue';

export default {
    components: { Stage },
    props: ['schedule'],
}
</script>
