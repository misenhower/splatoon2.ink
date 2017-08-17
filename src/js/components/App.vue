<template>
    <div class="hero is-fullheight" id="main">

        <!-- Site header -->
        <div class="hero-head">
            <div class="container is-fluid">
                <div class="level is-marginless">
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

                <div class="level">
                    <div class="level-left"></div>
                    <div class="level-right">
                        <div class="level-item">
                            <Dropdown :options="regions" v-model="selectedRegionKey" style="margin: 0 -12px"></Dropdown>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main body area -->
        <div class="hero-body">
            <div class="container is-fluid">
                <!-- Loading spinner -->
                <div v-if="loading" class="has-text-centered">
                    <span class="icon is-large">
                        <span class="fa fa-spin squid-refresh"></span>
                    </span>
                </div>

                <div v-else>
                    <!-- Active Splatfest: Show the Splatfest box and the Splatfest Battle box -->
                    <div v-if="isFestivalActive" class="columns is-desktop limited-width">
                        <div class="column">
                            <div class="splatfest tilt-left">
                                <div class="hook-box">
                                    <SplatfestBox :festival="festival" :now="now"></SplatfestBox>
                                </div>
                            </div>
                        </div>
                        <div class="column">
                            <ScheduleBox class="main-schedule-box splatfest-schedule-box tilt-right" cssClass="regular" :schedules="regular" :festival="festival" :now="now"></ScheduleBox>
                        </div>
                    </div>

                    <!-- No active Splatfest: Show the Regular, Ranked, and League Battle boxes -->
                    <div v-else class="columns is-desktop">
                        <div class="column">
                            <ScheduleBox class="main-schedule-box tilt-left" cssClass="regular" :schedules="regular" :now="now"></ScheduleBox>
                        </div>
                        <div class="column">
                            <ScheduleBox class="main-schedule-box tilt-right" cssClass="ranked" :schedules="ranked" :now="now"></ScheduleBox>
                        </div>
                        <div class="column">
                            <ScheduleBox class="main-schedule-box tilt-left" cssClass="league" :schedules="league" :now="now"></ScheduleBox>
                        </div>
                    </div>

                    <!-- Upcoming Splatfest and Salmon Run boxes -->
                    <div class="columns is-desktop limited-width">
                        <div class="column" v-if="festival && !isFestivalActive && festival.times.start > now">
                            <div class="splatfest tilt-right" style="margin-top: 40px">
                                <div class="hook-box">
                                    <SplatfestBox :festival="festival" :now="now"></SplatfestBox>
                                </div>
                            </div>
                        </div>
                        <div class="column" v-if="coop || coopCalendar">
                            <div class="salmon-run tilt-left">
                                <div class="hook-box">
                                    <SalmonRunBox :coop="coop" :coopCalendar="coopCalendar" :now="now"></SalmonRunBox>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="hero-foot has-text-centered has-text-grey is-size-7" style="margin-bottom: 0.5rem">
            <div class="container is-fluid">
                This website is not affiliated with Nintendo.
                All product names, logos, and brands are property of their respective owners.
                <a href="#" @click.prevent="aboutOpen = true">About</a>
            </div>
        </div>

        <AboutDialog v-if="aboutOpen" @close="aboutOpen = false"></AboutDialog>
    </div>
</template>

<style>
#main .limited-width {
    max-width: 1392px;
    margin-left: auto;
    margin-right: auto;
}
</style>

<script>
import axios from 'axios';
import Dropdown from './Dropdown.vue';
import ScheduleBox from './splatoon/ScheduleBox.vue';
import SalmonRunBox from './splatoon/SalmonRunBox.vue';
import SplatfestBox from './splatoon/SplatfestBox.vue';
import AboutDialog from './AboutDialog.vue';

export default {
    components: { Dropdown, ScheduleBox, SalmonRunBox, SplatfestBox, AboutDialog },
    data() {
        return {
            regions: [
                { key: null, name: 'Global' },
                { key: 'na', name: 'North America' },
            ],
            selectedRegionKey: null,
            now: null,
            splatnet: {
                schedules: null,
                timeline: null,
                festivals: {
                    na: null,
                },
            },
            salmonruncalendar: null,
            aboutOpen: false,
        };
    },
    computed: {
        loading() { return !this.splatnet.schedules || !this.splatnet.timeline; },
        regular() { return !this.loading && this.splatnet.schedules.regular.filter(this.filterSchedule) },
        ranked() { return !this.loading && this.splatnet.schedules.gachi.filter(this.filterSchedule) },
        league() { return !this.loading && this.splatnet.schedules.league.filter(this.filterSchedule) },
        festival() {
            if (this.loading || !this.selectedRegionKey)
                return;

            let festivals = this.splatnet.festivals[this.selectedRegionKey];
            return festivals && festivals.festivals && festivals.festivals[0];
        },
        isFestivalActive() {
            return this.festival && this.festival.times.start <= this.now && this.festival.times.end > this.now;
        },
        coop() {
            if (!this.loading && this.splatnet.timeline.coop && this.splatnet.timeline.coop.schedule.end_time > this.now)
                return this.splatnet.timeline.coop;
        },
        coopCalendar() {
            if (this.salmonruncalendar) {
                let schedules = this.salmonruncalendar.schedules.filter(this.filterSchedule);
                if (schedules.length > 0)
                    return schedules;
            }
        },
    },
    created() {
        this.detectRegion();

        this.updateNow();
        this.updateNowTimer = setInterval(() => {
            this.updateNow();
        }, 200);

        // Periodically retrieve updated data
        this.updateDataTimer = setInterval(() => {
            this.updateData();
        }, 15 * 60 * 1000); // 15 minutes
        this.updateData();
    },
    beforeDestroy() {
        clearInterval(this.updateNowTimer);
        clearInterval(this.updateDataTimer);
    },
    methods: {
        updateData() {
            // Main map schedules
            axios.get('/data/schedules.json')
                .then(response => this.splatnet.schedules = response.data)
                .catch(e => console.error(e));

            // Co-op (Salmon Run) data
            axios.get('/data/timeline.json')
                .then(response => this.splatnet.timeline = response.data)
                .catch(e => console.error(e));

            // Splatfest data
            axios.get('/data/festivals-na.json')
                .then(response => this.splatnet.festivals.na = response.data)
                .catch(e => console.error(e));

            // Salmon Run calendar data (upcoming Salmon Run schedules)
            axios.get('/data/salmonruncalendar.json')
                .then(response => this.salmonruncalendar = response.data)
                .catch(e => console.error(e));
        },
        detectRegion() {
            if (window.navigator && window.navigator.language) {
                switch (window.navigator.language) {
                    case 'en-US':
                    case 'en-CA':
                    case 'es-MX':
                        this.selectedRegionKey = 'na';
                }
            }
        },
        updateNow() {
            this.now = Math.trunc((new Date).getTime() / 1000);
        },
        filterSchedule(item) {
            return item.end_time > this.now;
        },
    },
}
</script>
