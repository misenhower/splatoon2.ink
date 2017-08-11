<template>
    <div>
        <div v-if="first">
            <div class="is-size-5 title-squid font-splatoon1">
                <span v-if="first.start_time <= this.now">Now</span>
                <span v-else-if="onlyFirst">Next</span>
                <span v-else>Soon!</span>
            </div>

            <ScheduleRow :schedule="first" :now="now"></ScheduleRow>
        </div>
        <template v-if="!onlyFirst">
            <div v-if="second">
                <div class="is-size-5 title-squid font-splatoon1" style="margin-top: 10px">
                    Next
                </div>

                <ScheduleRow :schedule="second" :now="now"></ScheduleRow>
            </div>

            <div v-if="others && others.length">
                <div class="is-size-5 title-squid font-splatoon1" style="margin-top: 10px">
                    Future
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
    props: ['schedules', 'now', 'onlyFirst'],
    computed: {
        first() { return this.schedules && this.schedules[0]; },
        second() { return this.schedules && this.schedules[1]; },
        others() { return this.schedules && this.schedules.slice(2); },
    },
}
</script>
