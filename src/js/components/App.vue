<template>
    <div class="hero is-fullheight" id="main">
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

        <div class="hero-body">
            <div class="container is-fluid">
                <div v-if="loading" class="has-text-centered">
                    <span class="icon is-large">
                        <span class="fa fa-spin squid-refresh"></span>
                    </span>
                </div>

                <div v-else>
                    <div v-if="isFestivalActive" class="columns is-desktop" style="max-width: 1392px; margin: auto">
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

                    <div class="columns is-desktop" style="max-width: 1392px; margin: auto">
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

        <div class="hero-foot has-text-centered has-text-grey is-size-7" style="margin-bottom: 0.5rem">
            <div class="container is-fluid">
                This website is not affiliated with Nintendo.
                All product names, logos, and brands are property of their respective owners.
                <a href="#" @click.prevent="aboutOpen = true">About</a>
            </div>
        </div>

        <Modal v-if="aboutOpen" @close="aboutOpen = false">
            <div class="modal-content tilt-left-slight" style="max-height: 100vh">
                <div class="about-box">
                    <div class="hook-box">
                        <div class="content">
                            <h3 class="font-splatoon2 title is-3">
                                <div class="image is-pulled-right hero-image is-hidden-touch" style="width: 307px; height: 250px;">
                                    <img src="../../img/hero-char.png" />
                                </div>
                                Hello!
                            </h3>
                            <p>
                                Splatoon2.ink shows the current and upcoming map schedules for Splatoon 2.
                            </p>
                            <p>
                                This site was built with <a href="https://vuejs.org/" target="_blank">Vue.js</a>
                                and <a href="http://bulma.io/" target="_blank">Bulma</a>.
                                All data comes from the SplatNet 2 API.
                            </p>
                            <p>
                                <a href="https://twitter.com/mattisenhower" target="_blank">Follow me on Twitter</a>
                                or <a href="mailto:matt@isenhower.com" target="_blank">email me</a> with any questions!
                            </p>
                            <h5 class="font-splatoon2 title is-5">Notes &amp; Issues</h5>
                            <p>
                                <strong>Salmon Run:</strong>
                                The SplatNet API doesn't provide a way to see maps, available weapons, or upcoming Salmon Run times.
                                Upcoming times are provided by
                                <a href="https://www.reddit.com/r/splatoon/comments/6pgqy4/i_couldnt_find_a_calendar_online_with_a_list_of/" target="_blank">thejellydude</a>.
                            </p>
                            <p>
                                <strong>Splatfests:</strong>
                                Only North American Splatfests are displayed since the API seems to be restricted to the region you purchased the game from.
                                I may manually enter times for Splatfests in other regions in the future.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    </div>
</template>

<script>
import axios from 'axios';
import Dropdown from './Dropdown.vue';
import Modal from './Modal.vue';
import ScheduleBox from './ScheduleBox.vue';
import SalmonRunBox from './SalmonRunBox.vue';
import SplatfestBox from './SplatfestBox.vue';

export default {
    components: { Dropdown, Modal, ScheduleBox, SalmonRunBox, SplatfestBox },
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
            axios.get('/data/festivals-na.json').then(response => this.splatnet.festivals.na = response.data);
            axios.get('/data/salmonruncalendar.json').then(response => this.salmonruncalendar = response.data);
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
