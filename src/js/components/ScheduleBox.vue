<template>
    <div v-if="firstSchedule">
        <h2 class="title is-2">{{ firstSchedule.game_mode.name }}</h2>
        <h3 class="title is-3">{{ firstSchedule.rule.name }}</h3>
        <div class="columns">
            <div class="column"><Stage :stage="firstSchedule.stage_a"></Stage></div>
            <div class="column"><Stage :stage="firstSchedule.stage_b"></Stage></div>
        </div>
        <div v-if="upcomingSchedule">
            <button @click="previousSchedule">Prev</button>
            <button @click="nextSchedule">Next</button>
        </div>
        <div class="columns" v-if="upcomingSchedule">
            <div class="column">
                <div v-if="upcomingScheduleIndex == 0">
                    Next
                </div>
                <div v-else>
                    Soon
                </div>
                <div>{{ upcomingSchedule.rule.name }}</div>
            </div>
            <div class="column"><Stage :stage="upcomingSchedule.stage_a"></Stage></div>
            <div class="column"><Stage :stage="upcomingSchedule.stage_b"></Stage></div>
        </div>
    </div>
</template>

<script>
import Stage from './Stage.vue';

export default {
    components: { Stage },
    props: ['schedules', 'now'],
    data() {
        return {
            upcomingScheduleIndex: 0,
        };
    },
    computed: {
        firstSchedule() { return this.schedules && this.schedules[0]; },
        upcomingSchedules() { return this.schedules && this.schedules.slice(1); },
        upcomingSchedule() { return this.upcomingSchedules && this.upcomingSchedules[this.upcomingScheduleIndex]; },
    },
    watch: {
        firstSchedule(newSchedule, oldSchedule) { if (oldSchedule != newSchedule) this.upcomingScheduleIndex = 0; },
    },
    methods: {
        nextSchedule() {
            this.upcomingScheduleIndex++;
            if (this.upcomingScheduleIndex >= this.upcomingSchedules.length)
                this.upcomingScheduleIndex = 0;
        },
        previousSchedule() {
            this.upcomingScheduleIndex--;
            if (this.upcomingScheduleIndex < 0)
                this.upcomingScheduleIndex = this.upcomingSchedules.length - 1;
        },
    },
}
</script>
