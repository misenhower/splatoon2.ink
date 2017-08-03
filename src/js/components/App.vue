<template>
    <div class="hero is-fullheight">
        <div class="hero-body">
            <div class="container is-fluid">
                <div v-if="loading">
                    Loading...
                </div>
                <div v-else>
                    <div class="columns is-desktop">
                        <div class="column">
                            <ScheduleBox class="schedule-box tilt-left regular" :schedules="regular" :now="now"></ScheduleBox>
                        </div>
                        <div class="column">
                            <ScheduleBox class="schedule-box tilt-right ranked" :schedules="ranked" :now="now"></ScheduleBox>
                        </div>
                        <div class="column">
                            <ScheduleBox class="schedule-box tilt-left league" :schedules="league" :now="now"></ScheduleBox>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import ScheduleBox from './ScheduleBox.vue';

export default {
    components: { ScheduleBox },
    data() {
        return {
            now: null,
            splatnet: {
                schedules: null,
            },
        };
    },
    computed: {
        loading() { return !this.splatnet.schedules; },
        regular() { return !this.loading && this.splatnet.schedules.regular.filter(this.filterSchedule) },
        ranked() { return !this.loading && this.splatnet.schedules.gachi.filter(this.filterSchedule) },
        league() { return !this.loading && this.splatnet.schedules.league.filter(this.filterSchedule) },
    },
    created() {
        this.updateNow();
        this.timer = setInterval(() => {
            this.updateNow();
        }, 200);
        this.updateData();
    },
    beforeDestroy() {
        clearInterval(this.timer);
    },
    methods: {
        async updateData() {
            let schedules = await axios.get('/data/schedules.json');
            this.splatnet.schedules = schedules.data;
        },
        updateNow() {
            this.now = Math.trunc((new Date).getTime() / 1000);
        },
        filterSchedule(item) {
            return item.end_time >= this.now;
        },
    },
}
</script>
