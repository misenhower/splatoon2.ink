<template>
    <div>
        <div v-if="first">
            <div class="is-size-5 title-squid font-splatoon1">
                <span v-if="first.start_time <= this.now">{{ $t('times.now') }}</span>
                <span v-else>{{ $t('times.soon') }}</span>
            </div>

            <ScheduleRow :schedule="first" :now="now"></ScheduleRow>
        </div>
        <template>
            <div v-if="second">
                <div class="is-size-5 title-squid font-splatoon1" style="margin-top: 10px">
                    {{ $t('times.next') }}
                </div>

                <ScheduleRow :schedule="second" :now="now"></ScheduleRow>
            </div>

            <div v-if="others && others.length">
                <div class="is-size-5 title-squid font-splatoon1" style="margin-top: 10px">
                    {{ $t('times.future') }}
                </div>

                <ScheduleRow
                    v-for="schedule in others"
                    :key="schedule.id"
                    :schedule="schedule"
                    :now="now"
                    ></ScheduleRow>
            </div>

        </template>
    </div>
</template>

<script>
import ScheduleRow from './ScheduleRow.vue';

export default {
    components: { ScheduleRow },
    props: ['schedules', 'now'],
    computed: {
        first() { return this.schedules && this.schedules[0]; },
        second() { return this.schedules && this.schedules[1]; },
        others() { return this.schedules && this.schedules.slice(2); },
    },
}
</script>
