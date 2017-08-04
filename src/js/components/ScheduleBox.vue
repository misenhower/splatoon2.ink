<template>
    <div class="font-splatoon2" v-if="firstSchedule">
        <h2 class="title is-3 is-size-2-fullhd font-splatoon1">
            <span class="schedule-icon"></span>{{ firstSchedule.game_mode.name }}
        </h2>

        <div class="main-schedule">
            <div class="level is-mobile top-bar">
                <div class="level-left">
                    <div class="level-item title-color is-size-5">{{ firstSchedule.rule.name }}</div>
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

        <div class="upcoming-schedule" v-if="upcomingSchedule">
            <div class="is-size-5 title-squid font-splatoon1">
                Next
            </div>
            <div class="level is-mobile is-marginless is-hidden-tablet">
                <div class="level-left">
                    <div class="level-item title-color is-size-5">{{ upcomingSchedule.rule.name }}</div>
                </div>
                <div class="level-right">
                    <div class="level-item">
                        in {{ upcomingSchedule.start_time - now | duration }},
                        {{ upcomingSchedule.start_time | time }} &ndash;
                        {{ upcomingSchedule.end_time | time }}
                    </div>
                </div>
            </div>

            <div class="columns is-slim" v-if="upcomingSchedule">
                <div class="column has-text-centered is-hidden-mobile" style="margin-top: auto; margin-bottom: auto;">
                    <div class="title is-6 is-size-5-fullhd">{{ upcomingSchedule.rule.name }}</div>
                    <div class="subtitle is-7 is-size-6-fullhd ">
                        in {{ upcomingSchedule.start_time - now | duration }}
                        <br />
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
        // nextSchedule() {
        //     this.upcomingScheduleIndex++;
        //     if (this.upcomingScheduleIndex >= this.upcomingSchedules.length)
        //         this.upcomingScheduleIndex = 0;
        // },
        // previousSchedule() {
        //     this.upcomingScheduleIndex--;
        //     if (this.upcomingScheduleIndex < 0)
        //         this.upcomingScheduleIndex = this.upcomingSchedules.length - 1;
        // },
    },
}
</script>
