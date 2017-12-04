<template>
    <div class="font-splatoon2" :class="cssClass" v-if="gameMode">
        <GameModeHeader :gameMode="gameMode" :festival="festival" :now="now"></GameModeHeader>

        <div class="main-schedule" v-if="currentSchedule">
            <div class="level is-mobile top-bar">
                <div class="level-left">
                    <div class="level-item title-color is-size-5">{{ currentRuleName }}</div>
                </div>
                <div class="level-right">
                    <div class="level-item">
                        {{ currentSchedule.start_time | time }} &ndash;
                        {{ currentSchedule.end_time | time }}
                    </div>
                </div>
            </div>
            <div class="is-clearfix"></div>
            <div class="columns is-mobile is-slim">
                <div class="column"><Stage :stage="currentSchedule.stage_a"></Stage></div>
                <div class="column"><Stage :stage="currentSchedule.stage_b"></Stage></div>
                <template v-if="festival">
                    <div class="column"><Stage :stage="festival.special_stage"></Stage></div>
                </template>
            </div>
        </div>

        <template v-if="upcomingSchedules && upcomingSchedules[0]">
            <div class="is-size-5 title-squid font-splatoon1">
                {{ $t('times.next') }}
            </div>

            <ScheduleRow
                :schedule="upcomingSchedules[0]"
                :now="now"
                :smallSize="true"
                ></ScheduleRow>
        </template>

        <p class="has-text-centered" style="margin-top: 10px">
            <button class="button is-translucent is-rounded" @click="dialogOpen = true">
                <span class="icon squid-icon-tilt">
                    <span class="fa squid-squid"></span>
                </span>
                <span class="font-splatoon2">All Upcoming Stages</span>
            </button>
        </p>

        <ScheduleDialog
            v-if="dialogOpen"
            :schedules="schedules"
            :gameMode="gameMode"
            :cssClass="cssClass"
            :now="now"
            @close="dialogOpen = false"
            ></ScheduleDialog>
    </div>
</template>

<script>
import GameModeHeader from './GameModeHeader.vue';
import Stage from './Stage.vue';
import ScheduleRow from './ScheduleRow.vue';
import ScheduleDialog from './ScheduleDialog.vue';

export default {
    components: { GameModeHeader, Stage, ScheduleRow, ScheduleDialog },
    props: ['schedules', 'cssClass', 'festival', 'now'],
    data() {
        return {
            dialogOpen: false,
        };
    },
    computed: {
        gameMode() {
            if (this.schedules && this.schedules[0])
                return this.schedules[0].game_mode;
        },
        currentSchedule() {
            if (this.schedules && this.schedules[0] && this.schedules[0].start_time <= this.now)
                return this.schedules[0];
        },
        currentRuleName() {
            let rule = this.currentSchedule.rule;
            return this.$t(`splatnet.rules.${rule.key}.name`, rule.name);
        },
        upcomingSchedules() {
            if (this.schedules) {
                if (this.currentSchedule)
                    return this.schedules.slice(1);
                return this.schedules;
            }
        }
    },
}
</script>
