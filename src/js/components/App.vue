<template>
    <div class="hero is-fullheight">
        <div class="hero-head">
            <div class="container is-fluid">
                <div class="level">
                    <div class="level-left">
                        <div class="level-item">
                            <h1 class="title is-1 font-splatoon1 is-inline">Splatoon 2</h1>
                        </div>
                    </div>
                    <div class="level-right">
                        <div class="level-item">
                            <h3 class="subtitle is-3 font-splatoon2 is-inline">Map Schedules</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>

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

                    <div v-if="coop">
                        <div class="salmon-run tilt-left">
                            <div class="hook-box">
                                <SalmonRunBox :coop="coop" :now="now"></SalmonRunBox>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <div class="hero-foot has-text-centered has-text-grey is-size-7" style="margin-bottom: 0.5rem">
            <div class="container is-fluid">
                This website is not affiliated with Nintendo.
                All product names, logos, and brands are property of their respective owners.
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import ScheduleBox from './ScheduleBox.vue';
import SalmonRunBox from './SalmonRunBox.vue';

export default {
    components: { ScheduleBox, SalmonRunBox },
    data() {
        return {
            now: null,
            splatnet: {
                schedules: null,
                timeline: null,
            },
        };
    },
    computed: {
        loading() { return !this.splatnet.schedules || !this.splatnet.timeline; },
        regular() { return !this.loading && this.splatnet.schedules.regular.filter(this.filterSchedule) },
        ranked() { return !this.loading && this.splatnet.schedules.gachi.filter(this.filterSchedule) },
        league() { return !this.loading && this.splatnet.schedules.league.filter(this.filterSchedule) },
        coop() {
            if (!this.loading && this.splatnet.timeline.coop.schedule.end_time >= this.now)
                return this.splatnet.timeline.coop;
        },
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
        updateData() {
            axios.get('/data/schedules.json').then(response => this.splatnet.schedules = response.data);
            axios.get('/data/timeline.json').then(response => this.splatnet.timeline = response.data);
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
