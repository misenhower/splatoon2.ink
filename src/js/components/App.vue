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
                        <div class="level-item" v-if="showFestivalRegionDropdown">
                            <Dropdown :options="regions" v-model="selectedRegionKey" style="margin: 0 -12px"></Dropdown>
                        </div>


                        <div class="level-item" v-if="showFestivalRegionDropdown">
                            <!-- Empty spacer to add some room when festivals are active -->
                        </div>

                        <div class="level-item" v-if="merchandises && merchandises.length">
                            <button class="button is-translucent-dark is-rounded" @click="splatNetGearOpen = true">
                                <span class="font-splatoon2">SplatNet Gear</span>
                            </button>
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
                    <div v-if="isSelectedFestivalActive" class="columns is-desktop limited-width">
                        <div class="column">
                            <div class="splatfest tilt-left">
                                <div class="hook-box">
                                    <SplatfestBox :festival="selectedFestival" :now="now"></SplatfestBox>
                                </div>
                            </div>
                        </div>
                        <div class="column">
                            <ScheduleBox class="main-schedule-box splatfest-schedule-box tilt-right" cssClass="regular" :schedules="regular" :festival="selectedFestival" :now="now"></ScheduleBox>
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
                    <div class="columns is-desktop" :class="{'limited-width': !bottomRowHasThreeColumns}">
                        <div class="column" v-if="selectedFestival && !isSelectedFestivalActive">
                            <div class="splatfest tilt-right" style="margin-top: 40px">
                                <div class="hook-box">
                                    <SplatfestBox :festival="selectedFestival" :now="now"></SplatfestBox>
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

                        <div class="column is-narrow-desktop-only" :class="{'is-hidden-touch is-hidden-desktop-only is-hidden-widescreen-only': bottomRowHasThreeColumns }" style="margin-top: 40px" v-if="newWeapon">
                            <div class="new-weapon tilt-right">
                                <NewWeaponBox :weapon="newWeapon"></NewWeaponBox>
                            </div>
                        </div>
                    </div>

                    <div class="is-hidden-fullhd" style="margin-top: 20px" v-if="newWeapon && bottomRowHasThreeColumns">
                        <div class="new-weapon tilt-left">
                            <NewWeaponBox :weapon="newWeapon"></NewWeaponBox>
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
                &ndash;
                <a href="https://twitter.com/Splatoon2inkbot" target="_blank">Twitter</a>
            </div>
        </div>

        <AboutDialog v-if="aboutOpen" @close="aboutOpen = false"></AboutDialog>
        <SplatNetGearDialog
            v-if="splatNetGearOpen"
            :merchandises="merchandises"
            :now="now"
            @close="splatNetGearOpen = false"
            ></SplatNetGearDialog>
        <SalmonRunAdminDialog
            v-if="salmonRunAdminOpen"
            :coopCalendar="coopCalendar"
            @close="salmonRunAdminOpen = false"
            ></SalmonRunAdminDialog>
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
import regions from '@/js/regions';
import Dropdown from './Dropdown.vue';
import ScheduleBox from './splatoon/ScheduleBox.vue';
import SalmonRunBox from './splatoon/SalmonRunBox.vue';
import SplatfestBox from './splatoon/SplatfestBox.vue';
import NewWeaponBox from './splatoon/NewWeaponBox.vue';
import AboutDialog from './AboutDialog.vue';
import SplatNetGearDialog from './splatoon/SplatNetGearDialog.vue';

// Lazy loading since most people won't see this
const SalmonRunAdminDialog = () => import('./splatoon/SalmonRunAdminDialog.vue');

const localStorage = window.localStorage;

export default {
    components: { Dropdown, ScheduleBox, SalmonRunBox, SplatfestBox, NewWeaponBox, AboutDialog, SplatNetGearDialog, SalmonRunAdminDialog },
    data() {
        return {
            regions: regions.splatoonRegions,
            actualSelectedRegionKey: null,
            now: null,
            splatnet: {
                schedules: null,
                timeline: null,
                merchandises: null,
                festivals: null,
            },
            salmonruncalendar: null,
            aboutOpen: false,
            splatNetGearOpen: false,
            salmonRunAdminOpen: false,
        };
    },
    computed: {
        loading() { return !this.splatnet.schedules; },

        // Selected region
        selectedRegionKey: {
            get() { return this.actualSelectedRegionKey; },
            set(value) { this.setRegion(value); },
        },

        // Normal battles
        regular() { return !this.loading && this.splatnet.schedules.regular.filter(this.filterEndTime) },
        ranked() { return !this.loading && this.splatnet.schedules.gachi.filter(this.filterEndTime) },
        league() { return !this.loading && this.splatnet.schedules.league.filter(this.filterEndTime) },

        // Festivals
        festivals() {
            if (this.splatnet.festivals) {
                return {
                    na: (this.splatnet.festivals.na.festivals || []).filter(this.filterFestivals),
                    eu: (this.splatnet.festivals.eu.festivals || []).filter(this.filterFestivals),
                    jp: (this.splatnet.festivals.jp.festivals || []).filter(this.filterFestivals),
                };
            }
        },
        showFestivalRegionDropdown() {
            if (this.festivals)
                return Object.values(this.festivals).some(arr => arr.length > 0);
                // return this.festivals.na.length > 0 || this.festivals.eu.length > 0 || this.festivals.jp.length > 0;
        },
        selectedFestival() {
            if (this.festivals && this.selectedRegionKey)
                return this.festivals[this.selectedRegionKey][0];
        },
        isSelectedFestivalActive() {
            return this.selectedFestival && this.selectedFestival.times.start <= this.now;
            // return this.festival && this.festival.times.start <= this.now && this.festival.times.end > this.now;
        },

        // Salmon Run
        coop() {
            if (this.splatnet.timeline && this.splatnet.timeline.coop && this.splatnet.timeline.coop.schedule.end_time > this.now)
                return this.splatnet.timeline.coop;
        },
        coopCalendar() {
            if (this.salmonruncalendar) {
                let schedules = this.salmonruncalendar.schedules.filter(this.filterEndTime);
                if (schedules.length > 0)
                    return schedules;
            }
        },

        // New weapons
        newWeapon() {
            if (this.splatnet.timeline && this.splatnet.timeline.weapon_availability && this.splatnet.timeline.weapon_availability.availabilities) {
                let availability = this.splatnet.timeline.weapon_availability.availabilities[0];
                if (availability.release_time <= this.now)
                    return availability.weapon;
            }
        },

        // SplatNet Merchandise
        merchandises() {
            if (this.splatnet.merchandises && this.splatnet.merchandises.merchandises)
                return this.splatnet.merchandises.merchandises.filter(this.filterEndTime);
        },

        // Other
        bottomRowHasThreeColumns() {
            return this.selectedFestival && !this.isSelectedFestivalActive && (this.coop || this.coopCalendar) && this.newWeapon;
        },
    },
    created() {
        this.loadRegion(true);
        window.addEventListener('storage', this.loadRegion);
        window.addEventListener('keydown', this.keydown);

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
        window.removeEventListener('storage', this.loadRegion);
        window.removeEventListener('keydown', this.keydown);
    },
    methods: {
        loadRegion(autoDetect = false) {
            // Get the previously-selected region from local storage
            let key = localStorage.getItem('selected-region');
            if (key !== null) {
                let region = regions.getRegionByKey(key);
                this.actualSelectedRegionKey = (region) ? region.key : null;
                return;
            }

            // If no region was previously selected, attempt to detect the region by the browser's language
            if (autoDetect)
                this.actualSelectedRegionKey = regions.detectSplatoonRegion();
        },
        keydown(event) {
            // Ctrl-Alt-Shift-Z
            if (event.ctrlKey && event.altKey && event.shiftKey && event.key === 'Z')
                this.salmonRunAdminOpen = true;
        },
        setRegion(key) {
            let region = regions.getRegionByKey(key);
            key = (region) ? region.key : null;
            this.actualSelectedRegionKey = key;
            localStorage.setItem('selected-region', key);
        },
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
            axios.get('/data/festivals.json')
                .then(response => this.splatnet.festivals = response.data)
                .catch(e => console.error(e));

            // Splatnet merchandise data
            axios.get('/data/merchandises.json')
                .then(response => this.splatnet.merchandises = response.data)
                .catch(e => console.error(e));

            // Salmon Run calendar data (upcoming Salmon Run schedules)
            axios.get('/data/salmonruncalendar.json')
                .then(response => this.salmonruncalendar = response.data)
                .catch(e => console.error(e));
        },
        updateNow() {
            this.now = Math.trunc((new Date).getTime() / 1000);
        },
        filterEndTime(item) {
            return item.end_time > this.now;
        },
        filterFestivals(item) {
            return item.times.end > this.now;
        },
    },
}
</script>
