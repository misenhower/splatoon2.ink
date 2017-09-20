<template>
    <div v-if="schedule">
        <h3 class="title is-3 font-splatoon1 has-text-centered">{{ schedule.game_mode.name }}</h3>
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
