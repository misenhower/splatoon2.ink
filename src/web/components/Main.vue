<template>
    <div class="hero is-fullheight" id="main">

        <!-- Site header -->
        <div class="hero-head">
            <!-- <VoteBanner /> -->

            <div class="container is-fluid">
                <div class="level is-marginless">
                    <div class="level-left">
                        <div class="level-item">
                            <h1 class="title is-1 font-splatoon1 is-inline">Splatoon 2</h1>
                        </div>
                    </div>

                    <div class="level-right">
                        <div class="level-item">
                            <h3 class="subtitle is-3 font-splatoon2 is-inline">{{ $t('ui.map_schedules') }}</h3>
                        </div>
                    </div>
                </div>

                <div class="level">
                    <div class="level-left">
                        <div class="level-item">
                            <a href="https://twitter.com/Splatoon2inkbot" target="_blank" class="button is-translucent-dark is-rounded">
                                <span class="font-splatoon2">{{ $t('ui.get_updates_via_twitter') }}</span>
                            </a>
                        </div>
                    </div>
                    <div class="level-right">
                        <div class="level-item" v-if="showFestivalRegionDropdown">
                            <Dropdown :options="regions" v-model="selectedRegionKey" style="margin: 0 -12px" class="font-splatoon2 is-right-tablet" />
                        </div>


                        <div class="level-item" v-if="showFestivalRegionDropdown">
                            <!-- Empty spacer to add some room when festivals are active -->
                        </div>

                        <div class="level-item" v-if="hasMerchandises">
                            <router-link to="/splatnet" class="button is-translucent-dark is-rounded">
                                <span class="font-splatoon2">{{ $t('splatnet_gear.button') }}</span>
                            </router-link>
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
                    <div v-if="selectedRegionHasActiveSplatfest" class="columns is-desktop limited-width">
                        <div class="column">
                            <div class="splatfest tilt-left">
                                <div class="hook-box">
                                    <SplatfestBox :festival="selectedRegionCurrentSplatfest" />
                                </div>
                            </div>
                        </div>
                        <div class="column">
                            <ScheduleBox class="main-schedule-box splatfest-schedule-box tilt-right" mode="regular" />
                        </div>
                    </div>

                    <!-- No active Splatfest: Show the Regular, Ranked, and League Battle boxes -->
                    <div v-else class="columns is-desktop">
                        <div class="column">
                            <ScheduleBox class="main-schedule-box tilt-left" mode="regular" />
                        </div>
                        <div class="column">
                            <ScheduleBox class="main-schedule-box tilt-right" mode="ranked" />
                        </div>
                        <div class="column">
                            <ScheduleBox class="main-schedule-box tilt-left" mode="league" />
                        </div>
                    </div>

                    <!-- Upcoming Splatfest and Salmon Run boxes -->
                    <div class="columns is-desktop" :class="{'limited-width': !bottomRowHasThreeColumns}">
                        <div class="column" v-if="showSplatfestOnBottomRow">
                            <div class="splatfest tilt-right" style="margin-top: 40px">
                                <div class="hook-box">
                                    <SplatfestBox :festival="selectedRegionCurrentSplatfest" />
                                </div>
                            </div>
                        </div>

                        <div class="column" v-if="shiftySchedule">
                            <div class="shifty-box font-splatoon2 tilt-right">
                                <h3 class="title is-4 font-splatoon1 has-text-centered" style="margin-bottom: 0.5rem">
                                    <template v-if="shiftySchedule.stages.length === 1">
                                        Current Shifty Station
                                    </template>
                                    <template v-else>
                                        Current Shifty Stations
                                    </template>
                                </h3>
                                <div class="columns">
                                    <div class="column">
                                        <Stage :stage="shiftySchedule.stages[0]" style="max-width: 215px; margin: auto" />
                                    </div>
                                    <div class="column" v-if="shiftySchedule.stages[1]">
                                        <Stage :stage="shiftySchedule.stages[1]" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="column" v-if="hasSalmonRun">
                            <div class="salmon-run tilt-left">
                                <div class="hook-box">
                                    <SalmonRunBox />
                                </div>
                            </div>
                        </div>

                        <div class="column" style="margin-top: 40px" :class="{'is-hidden-touch is-hidden-desktop-only is-hidden-widescreen-only': bottomRowHasThreeColumns }" v-if="hasWeapons && showWeaponsNextToSalmonRun">
                            <NewWeaponsContainer :max-weapons-per-row="3" />
                        </div>
                    </div>

                    <div style="margin-top: 40px" :class="{ 'is-hidden-fullhd': bottomRowHasThreeColumns }" v-if="showExtraWeaponsAtBottom">
                        <NewWeaponsContainer />
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="hero-foot has-text-centered has-text-grey is-size-7" style="margin-bottom: 0.5rem">
            <div class="container is-fluid">
                {{ $t('ui.disclaimer') }}
                &ndash;
                <router-link to="/about">{{ $t('ui.about') }}</router-link>
                <!-- &ndash; -->
                <!-- <router-link to="/finalfest">FinalFest</router-link> -->
                &ndash;
                <router-link to="/calendars">Calendar Feeds</router-link>
                &ndash;
                <a href="https://twitter.com/Splatoon2inkbot" target="_blank">Twitter</a>
                <template v-if="hasSplatfests">
                    &ndash;
                    <router-link to="/splatfests">{{ $t('splatfest.previous') }}</router-link>
                </template>
                &ndash;
                <Dropdown :options="languages" v-model="selectedLanguageKey" tag="a" class="is-right is-up" />
            </div>
        </div>

        <router-view @close="$router.push('/')" />
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
import { mapGetters, mapActions } from 'vuex';
import Dropdown from './Dropdown.vue';
import ScheduleBox from './splatoon/ScheduleBox.vue';
import SalmonRunBox from './splatoon/SalmonRunBox.vue';
import SplatfestBox from './splatoon/SplatfestBox.vue';
import NewWeaponsContainer from './splatoon/NewWeaponsContainer.vue';
import Stage from '@/web/components/splatoon/Stage.vue';
// import VoteBanner from '@/web/components/VoteBanner.vue';

export default {
    components: { Dropdown, ScheduleBox, SalmonRunBox, SplatfestBox, NewWeaponsContainer, Stage, /*VoteBanner*/ },
    computed: {
        ...mapGetters('splatoon/regions', ['selectedRegion']),
        ...mapGetters('splatoon/languages', ['selectedLanguage']),
        ...mapGetters('splatoon/splatfests', [
            'anyRegionHasCurrentSplatfest',
            'selectedRegionCurrentSplatfest',
            'selectedRegionHasActiveSplatfest',
        ]),
        ...mapGetters('splatoon/newWeapons', ['weapons']),
        ...mapGetters('splatoon/finalFest', { shiftySchedule: 'activeSchedule' }),

        loading() { return !this.$store.state.splatoon.data.schedules },

        hasMerchandises() {
            let merchandises = this.$store.getters['splatoon/splatNetStore/merchandises'];
            return merchandises && merchandises.length;
        },

        hasSplatfests() {
            return this.$store.state.splatoon.data.festivals;
        },

        hasSalmonRun() {
            let schedules = this.$store.getters['splatoon/salmonRun/currentSchedules'];
            return schedules && schedules.length;
        },

        hasWeapons() {
            return this.weapons && this.weapons.length;
        },

        // Selected region
        regions() {
            return this.$store.state.splatoon.regions.all.map(({ key }) => {
                let name = (key) ? this.$t(`regions.${key}.name`) : this.$t('regions.global.name');
                return { key, name };
            });
        },
        selectedRegionKey: {
            get() { return this.selectedRegion && this.selectedRegion.key; },
            set(value) { this.setRegion({ region: { key: value } }); },
        },

        // Selected langauge
        languages() {
            return this.$store.state.splatoon.languages.all
                .reduce((languages, languageInfo) => {
                    // Remove duplicates
                    if (!languages.find(li => li.language == languageInfo.language))
                        languages.push(languageInfo)
                    return languages;
                }, [])
                .map(({ language, name }) => ({ key: language, name }));
        },
        selectedLanguageKey: {
            get() { return this.selectedLanguage && this.selectedLanguage.language; },
            set(value) { this.setLanguage({ language: { language: value } }); },
        },

        showFestivalRegionDropdown() {
            return this.anyRegionHasCurrentSplatfest;
        },

        // Other
        showSplatfestOnBottomRow() {
            return this.selectedRegionCurrentSplatfest && !this.selectedRegionHasActiveSplatfest;
        },

        showWeaponsNextToSalmonRun() {
            let cutoff = (this.showSplatfestOnBottomRow) ? 3 : 6;
            return this.hasWeapons && this.weapons.length <= cutoff;
        },

        showExtraWeaponsAtBottom() {
            return this.hasWeapons && (!this.showWeaponsNextToSalmonRun || this.bottomRowHasThreeColumns);
        },

        bottomRowHasThreeColumns() {
            return this.showSplatfestOnBottomRow
                && this.hasSalmonRun
                && this.showWeaponsNextToSalmonRun;
        },
    },
    created() {
        this.initialize();
        this.startUpdatingNow();
        this.startUpdatingData();
    },
    beforeDestroy() {
        this.stopUpdatingNow();
        this.stopUpdatingData();
        this.shutdown();
    },
    methods: {
        ...mapActions('splatoon', ['startUpdatingNow', 'stopUpdatingNow']),
        ...mapActions('splatoon/settings', ['initialize', 'shutdown']),
        ...mapActions('splatoon/data', ['startUpdatingData', 'stopUpdatingData']),
        ...mapActions('splatoon/regions', ['setRegion']),
        ...mapActions('splatoon/languages', ['setLanguage']),
    },
}
</script>
