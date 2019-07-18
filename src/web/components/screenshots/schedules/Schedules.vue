<template>
    <Wrapper title="Map Schedules">
        <div class="columns font-splatoon2" v-if="!globalSplatfestIsActiveInAllRegions">
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
        <div class="columns is-gapless font-splatoon2" v-else>
            <div class="column" style="display: flex">
                <div class="splatfest">
                    <div class="hook-box">
                        <SplatfestBox :festival="currentSplatfestNA" global-splatfest-mode />
                    </div>

                    <template v-if="shiftySchedule">
                        <br />

                        <div class="shifty-box">
                            <h3 class="title is-4 font-splatoon1 has-text-centered" style="margin-bottom: 0.5rem">
                                Current Shifty Stations
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
                    </template>
                </div>
            </div>
            <div class="column is-5">
                <ScheduleBox class="main-schedule-box tilt-right" mode="regular" splatfest-battle style="max-width: 335px; margin-right: 20px" />
            </div>
        </div>
    </Wrapper>
</template>

<script>
import { mapGetters } from 'vuex';
import Wrapper from '@/web/components/screenshots/Wrapper.vue';
import ScheduleBox from './ScheduleBox.vue';
import SplatfestBox from '@/web/components/splatoon/SplatfestBox.vue';
import Stage from '@/web/components/splatoon/Stage.vue';

export default {
    components: { Wrapper, ScheduleBox, SplatfestBox, Stage },
    computed: {
        ...mapGetters('splatoon/splatfests', {
            'currentSplatfestNA': 'na/currentSplatfest',
            'currentSplatfestEU': 'eu/currentSplatfest',
            'currentSplatfestJP': 'jp/currentSplatfest',
        }),
        ...mapGetters('splatoon/finalFest', { shiftySchedule: 'activeSchedule' }),
        globalSplatfestIsActiveInAllRegions() {
            // Do we have a Splatfest in each region?
            if (!this.currentSplatfestNA || !this.currentSplatfestEU || !this.currentSplatfestJP)
                return false;

            // Is it the same Splatfest in each region?
            if (this.currentSplatfestNA.festival_id !== this.currentSplatfestEU.festival_id
                || this.currentSplatfestNA.festival_id !== this.currentSplatfestJP.festival_id)
                return false;

            // Is the Splatfest currently active in every region?
            if (this.currentSplatfestNA.state !== 'active'
                || this.currentSplatfestEU.state !== 'active'
                || this.currentSplatfestJP.state !== 'active')
                return false;

            // All checks passed, we have a global Splatfest active in all regions!
            return true;
        },
    },
};
</script>
