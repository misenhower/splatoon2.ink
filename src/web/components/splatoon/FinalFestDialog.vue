<template>
    <Modal @close="$emit('close')" class="is-wide splatfest-history-dialog modal-rounded-box" v-if="allSchedules">
        <div class="modal-card">
            <div class="modal-card-head">
                <h3 class="title is-3 font-splatoon1 text-shadow">FinalFest Shifty&nbsp;Station Schedule</h3>
            </div>

            <div class="modal-card-body" ref="body">
                <div class="has-text-right" style="margin-bottom: 1em">
                    <p>
                        Schedules:
                        <a href="https://twitter.com/SplatoonJP/status/1151426565387051009" target="_blank">
                            @SplatoonJP
                        </a>
                    </p>
                    <p>
                        Stage images and names:
                        <a href="https://leanny.github.io/feststages/" target="_blank">
                            LeanYoshi
                        </a>
                    </p>
                </div>

                <div class="font-splatoon2">
                    <div v-if="first">
                        <div class="is-size-5 title-squid font-splatoon1">
                            <span v-if="first.start_time <= now">{{ $t('times.now') }}</span>
                            <span v-else>{{ $t('times.soon') }}</span>
                        </div>

                        <ScheduleRow :schedule="first" />
                    </div>
                    <div v-if="second">
                        <div class="is-size-5 title-squid font-splatoon1" style="margin-top: 10px">
                            {{ $t('times.next') }}
                        </div>

                        <ScheduleRow :schedule="second" />
                    </div>

                    <div v-if="others && others.length">
                        <div class="is-size-5 title-squid font-splatoon1" style="margin-top: 10px">
                            {{ $t('times.future') }}
                        </div>

                        <ScheduleRow
                            v-for="schedule in others"
                            :key="schedule.start_time"
                            :schedule="schedule"
                            />
                    </div>
                </div>
            </div>
        </div>
    </Modal>
</template>

<script>
import Vue from 'vue';
import { mapGetters } from 'vuex';
import Modal from '@/web/components/Modal.vue';
import ScheduleRow from './ScheduleRow.vue';

export default {
    components: { Modal, ScheduleRow },
    filters: {
        resultsIn(time) {
            return Vue.i18n.translate('splatfest.results_in', { time });
        },
    },
    props: ['region'],
    computed: {
        ...mapGetters('splatoon', ['now']),
        ...mapGetters('splatoon/finalFest', { schedules: 'currentSchedules' }),

        allSchedules() {
            return this.schedules.map(schedule => ({
                ...schedule,
                stage_a: schedule.stages[0],
                stage_b: schedule.stages[1],
            }));
        },

        first() { return this.allSchedules && this.allSchedules[0]; },
        second() { return this.allSchedules && this.allSchedules[1]; },
        others() { return this.allSchedules && this.allSchedules.slice(2); },
    },
};
</script>
