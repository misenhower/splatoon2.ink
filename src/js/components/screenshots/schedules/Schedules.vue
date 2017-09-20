<template>
    <Wrapper title="Map Schedules" :time="$route.params.startTime">
        <div class="columns font-splatoon2">
            <div class="column">
                <ScheduleBox class="main-schedule-box tilt-left regular" :schedule="regular"></ScheduleBox>
            </div>

            <div class="column">
                <ScheduleBox class="main-schedule-box tilt-right ranked" :schedule="ranked"></ScheduleBox>
            </div>

            <div class="column">
                <ScheduleBox class="main-schedule-box tilt-left league" :schedule="league"></ScheduleBox>
            </div>
        </div>
    </Wrapper>
</template>

<script>
import axios from 'axios';
import Wrapper from '@/js/components/screenshots/Wrapper.vue';
import ScheduleBox from './ScheduleBox.vue';

export default {
    components: { Wrapper, ScheduleBox },
    data() {
        return {
            schedules: null,
        };
    },
    computed: {
        regular() {
            if (this.schedules)
                return this.schedules.regular.find(s => s.start_time == this.$route.params.startTime);
        },
        ranked() {
            if (this.schedules)
                return this.schedules.gachi.find(s => s.start_time == this.$route.params.startTime);
        },
        league() {
            if (this.schedules)
                return this.schedules.league.find(s => s.start_time == this.$route.params.startTime);
        },
    },
    created() {
        axios.get('data/schedules.json')
            .then(response => this.schedules = response.data)
    },
}
</script>
