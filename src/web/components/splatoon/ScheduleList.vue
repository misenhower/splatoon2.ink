<template>
    <div>
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
</template>

<script>
import { mapGetters } from 'vuex';
import ScheduleRow from './ScheduleRow.vue';

export default {
    components: { ScheduleRow },
    props: {
        mode: String,
    },
    computed: {
        ...mapGetters('splatoon', ['now']),
        schedules() {
            return this.$store.getters[`splatoon/schedules/${this.mode}/currentSchedules`];
        },
        first() { return this.schedules && this.schedules[0]; },
        second() { return this.schedules && this.schedules[1]; },
        others() { return this.schedules && this.schedules.slice(2); },
    },
};
</script>
