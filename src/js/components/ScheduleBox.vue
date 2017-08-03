<template>
    <div v-if="firstSchedule">
        <h2 class="title is-2">
            <span class="schedule-icon"></span>{{ firstSchedule.game_mode.name }}
        </h2>

        <div class="main-schedule">
            <div class="level is-mobile top-bar">
                <div class="level-left">
                    <div class="level-item rule-name">{{ firstSchedule.rule.name }}</div>
                </div>
                <div class="level-right">
                    <div class="level-item">
                        {{ firstSchedule.start_time | time }} &ndash;
                        {{ firstSchedule.end_time | time }}
                    </div>
                </div>
            </div>
            <div class="is-clearfix"></div>
            <div class="columns is-mobile is-slim">
                <div class="column"><Stage :stage="firstSchedule.stage_a"></Stage></div>
                <div class="column"><Stage :stage="firstSchedule.stage_b"></Stage></div>
            </div>
        </div>

        <div class="columns is-gapless" v-if="upcomingSchedule">
            <div class="column is-narrow"><button @click="previousSchedule">Prev</button></div>
            <div class="column">
                <div class="columns is-gapless" v-if="upcomingSchedule">
                    <div class="column">
                        <div v-if="upcomingScheduleIndex == 0">
                            Next
                        </div>
                        <div v-else>
                            Soon
                        </div>
                        <div>{{ upcomingSchedule.rule.name }}</div>
                        <div>in {{ upcomingSchedule.start_time - now | duration }}</div>
                        <div>
                            {{ upcomingSchedule.start_time | time }} &ndash;
                            {{ upcomingSchedule.end_time | time }}
                        </div>
                    </div>
                    <div class="column is-8">
                        <div class="columns is-mobile is-slim">
                            <div class="column"><Stage :stage="upcomingSchedule.stage_a"></Stage></div>
                            <div class="column"><Stage :stage="upcomingSchedule.stage_b"></Stage></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="column is-narrow"><button @click="nextSchedule">Next</button></div>
        </div>
    </div>
</template>

<script>
import moment from 'moment';
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
    filters: {
        time(value) {
            return moment.unix(value).local().format('ha');
        },
        duration(value) {
            let duration = moment.duration(value, 'seconds');
            let hours = Math.floor(duration.asHours());
            let minutes = ('0' + duration.minutes()).substr(-2);
            let seconds = ('0' + duration.seconds()).substr(-2);
            if (hours)
                return `${hours}h ${minutes}m ${seconds}s`;
            return `${minutes}m ${seconds}s`;
        },
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
