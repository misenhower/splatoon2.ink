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
                    <div class="level-left">
                        <div class="level-item">
                            <a href="https://twitter.com/Splatoon2inkbot" target="_blank" class="button is-translucent-dark is-rounded">
                                <span class="font-splatoon2">Get updates via Twitter!</span>
                            </a>
                        </div>
                    </div>
                    <div class="level-right">
                        <div class="level-item" v-if="showFestivalRegionDropdown">
                            <Dropdown :options="regions" v-model="selectedRegionKey" style="margin: 0 -12px"></Dropdown>
                        </div>


                        <div class="level-item" v-if="showFestivalRegionDropdown">
                            <!-- Empty spacer to add some room when festivals are active -->
                        </div>

                        <div class="level-item" v-if="merchandises && merchandises.length">
                            <button class="button is-translucent-dark is-rounded" @click="splatNetGearOpen = true">
                                <span class="font-splatoon2">{{ $t('splatnet_gear.button') }}</span>
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
                        <span class="fa fa-3x fa-spin squid-refresh"></span>
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
                                    <SplatfestBox :festival="selectedFestival" :results="selectedFestivalResults" :now="now"></SplatfestBox>
                                </div>
                            </div>
                        </div>

                        <div class="column" v-if="coopSchedules">
                            <div class="salmon-run tilt-left">
                                <div class="hook-box">
                                    <SalmonRunBox :coop="coop" :coopSchedules="coopSchedules" :now="now"></SalmonRunBox>
                                </div>
                            </div>
                        </div>

                        <div class="column is-narrow-desktop-only" :class="{'is-hidden-touch is-hidden-desktop-only is-hidden-widescreen-only': bottomRowHasThreeColumns }" style="margin-top: 40px" v-if="newWeapons">
                            <div class="new-weapon">
                                <div class="columns">
                                    <div class="column" v-for="(weapon, index) in newWeapons">
                                        <NewWeaponBox
                                            :weapon="weapon"
                                            :class="(index % 2 == 0) ? 'tilt-right' : 'tilt-left'"
                                            ></NewWeaponBox>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="is-hidden-fullhd" style="margin-top: 20px" v-if="newWeapons && bottomRowHasThreeColumns">
                        <div class="new-weapon">
                            <div style="display: flex; align-items: center; justify-content: center;">
                                <div v-for="(weapon, index) in newWeapons" style="margin: 0 20px">
                                    <NewWeaponBox
                                        :weapon="weapon"
                                        :class="(index % 2 == 0) ? 'tilt-right' : 'tilt-left'"
                                        ></NewWeaponBox>
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
import { mapActions } from 'vuex';
import regions from '@/js/regions';
import Dropdown from './Dropdown.vue';
import ScheduleBox from './splatoon/ScheduleBox.vue';
import SalmonRunBox from './splatoon/SalmonRunBox.vue';
import SplatfestBox from './splatoon/SplatfestBox.vue';
import NewWeaponBox from './splatoon/NewWeaponBox.vue';
import AboutDialog from './AboutDialog.vue';
import SplatNetGearDialog from './splatoon/SplatNetGearDialog.vue';

const localStorage = window.localStorage;

export default {
    components: { Dropdown, ScheduleBox, SalmonRunBox, SplatfestBox, NewWeaponBox, AboutDialog, SplatNetGearDialog },
    data() {
        return {
            actualSelectedRegionKey: null,
            now: null,
            splatnet: {
                schedules: null,
                coopSchedules: null,
                timeline: null,
                merchandises: null,
                festivals: null,
            },
            aboutOpen: false,
            splatNetGearOpen: false,
            language: null,
        };
    },
    computed: {
        loading() { return !this.splatnet.schedules; },

        // Selected region
        regions() {
            return regions.splatoonRegions.map(({ key }) => {
                let name = (key) ? this.$t(`regions.${key}.name`) : this.$t('regions.global.name');
                return { key, name };
            });
        },
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
        },
        selectedFestival() {
            if (this.festivals && this.selectedRegionKey)
                return this.festivals[this.selectedRegionKey][0];
        },
        selectedFestivalResults() {
            if (this.selectedFestival)
                return this.splatnet.festivals[this.selectedRegionKey].results.find(r => r.festival_id == this.selectedFestival.festival_id);
        },
        isSelectedFestivalActive() {
            return this.selectedFestival && this.selectedFestival.times.start <= this.now && this.selectedFestival.times.end > this.now;
        },

        // Salmon Run
        coop() {
            if (this.splatnet.timeline && this.splatnet.timeline.coop && this.splatnet.timeline.coop.schedule.end_time > this.now)
                return this.splatnet.timeline.coop;
        },
        coopSchedules() {
            if (this.splatnet.coopSchedules) {
                let details = this.splatnet.coopSchedules.details.filter(this.filterEndTime);
                let schedules = this.splatnet.coopSchedules.schedules.filter(this.filterEndTime);
                return { details, schedules };
            }
        },

        // New weapons
        newWeapons() {
            if (this.splatnet.timeline && this.splatnet.timeline.weapon_availability && this.splatnet.timeline.weapon_availability.availabilities) {
                let weapons = this.splatnet.timeline.weapon_availability.availabilities
                    .filter(a => a.release_time <= this.now)
                    .map(a => a.weapon);

                if (weapons.length > 0)
                    return weapons;
            }
        },

        // SplatNet Merchandise
        merchandises() {
            if (this.splatnet.merchandises && this.splatnet.merchandises.merchandises)
                return this.splatnet.merchandises.merchandises.filter(this.filterEndTime);
        },

        // Other
        bottomRowHasThreeColumns() {
            return this.selectedFestival && !this.isSelectedFestivalActive && (this.coop || this.coopSchedules) && this.newWeapons;
        },
    },
    created() {
        this.loadLanguage();
        this.loadRegion(true);
        window.addEventListener('storage', this.loadRegion);

        this.updateNow();
        this.updateNowTimer = setInterval(() => {
            this.updateNow();
        }, 200);

        // Periodically retrieve updated data
        this.scheduleUpdateData();
        this.updateData();
    },
    beforeDestroy() {
        clearInterval(this.updateNowTimer);
        clearInterval(this.updateDataTimer);
        window.removeEventListener('storage', this.loadRegion);
    },
    methods: {
        ...mapActions(['loadLocale']),
        loadLanguage() {
            this.language = regions.detectSplatoonLanguage();
            this.loadLocale(this.language);
            this.$i18n.set(this.language || 'en');
        },
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
        setRegion(key) {
            let region = regions.getRegionByKey(key);
            key = (region) ? region.key : null;
            this.actualSelectedRegionKey = key;
            localStorage.setItem('selected-region', key);
        },
        scheduleUpdateData() {
            let date = new Date;

            // If we're more than 20 seconds past the current hour, schedule the update for the next hour
            if (date.getMinutes() !== 0 || date.getSeconds() >= 20)
                date.setHours(date.getHours() + 1);
            date.setMinutes(0);

            // Random number of seconds past the hour (so all open browsers don't hit the server at the same time)
            let minSec = 25;
            let maxSec = 60;
            date.setSeconds(Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec);

            // Set the timeout
            this.updateDataTimer = setTimeout(() => {
                this.updateData();
                this.scheduleUpdateData();
            }, (date - new Date));
        },
        updateData() {
            // Language data
            if (this.language) {
                axios.get(`/data/lang/${this.language}.json`)
                    .then(response => this.$i18n.add(this.language, { splatnet: response.data }))
                    .catch(e => console.error(e));
            }

            // Main map schedules
            axios.get('/data/schedules.json')
                .then(response => this.splatnet.schedules = response.data)
                .catch(e => console.error(e));

            // Co-op schedules
            axios.get('/data/coop-schedules.json')
                .then(response => this.splatnet.coopSchedules = response.data)
                .catch(e => console.error(e));

            // Timeline data (Salmon Run weapon of the month and new weapon availability)
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
        },
        updateNow() {
            this.now = Math.trunc((new Date).getTime() / 1000);
        },
        filterEndTime(item) {
            return item.end_time > this.now;
        },
        filterFestivals(item) {
            // We want to show future/current festivals and festivals that ended recently (so we can show their results)
            // Filter based on the result time and show festival results for 2 days
            let cutoff = item.times.result + 172800; // 2 days
            return cutoff > this.now;
        },
    },
}
</script>
