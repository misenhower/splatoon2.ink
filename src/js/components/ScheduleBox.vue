<template>
    <div class="font-splatoon2" :class="cssClass" v-if="gameMode">
        <GameModeHeader :gameMode="gameMode" :festival="festival" :now="now"></GameModeHeader>

        <div class="main-schedule" v-if="currentSchedule">
            <div class="level is-mobile top-bar">
                <div class="level-left">
                    <div class="level-item title-color is-size-5">{{ currentSchedule.rule.name }}</div>
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

        <ScheduleList :schedules="upcomingSchedules" :now="now" :onlyFirst="true"></ScheduleList>

        <p class="has-text-centered" style="margin-top: 10px">
            <button class="button is-translucent is-rounded" @click="isOpen=true">
                <span class="icon squid-icon-tilt">
                    <span class="fa squid-squid"></span>
                </span>
                <span class="font-splatoon2">All Upcoming Stages</span>
            </button>
        </p>

        <Modal v-if="isOpen" @close="isOpen = false" class="font-splatoon2">
            <div class="modal-card schedule-box tilt-left-slight" :class="cssClass">
                <header class="modal-card-head">
                    <GameModeHeader :gameMode="gameMode"></GameModeHeader>
                </header>
                <section class="modal-card-body">
                    <ScheduleList :schedules="schedules" :now="now" :onlyFirst="false"></ScheduleList>
                </section>
            </div>
        </Modal>
    </div>
</template>

<script>
import Modal from './Modal.vue';
import GameModeHeader from './GameModeHeader.vue';
import Stage from './Stage.vue';
import ScheduleList from './ScheduleList.vue';

export default {
    components: { Modal, GameModeHeader, Stage, ScheduleList },
    props: ['schedules', 'cssClass', 'festival', 'now'],
    data() {
        return {
            isOpen: false,
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
