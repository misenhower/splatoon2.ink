<template>
    <Wrapper title="Salmon Run" :time="now">
        <div class="salmon-run tilt-left">
            <div class="hook-box">
                <SalmonRunBox
                    :coop="coop"
                    :coopCalendar="coopCalendar"
                    :now="now"
                    :screenshotMode="true"
                    ></SalmonRunBox>
            </div>
        </div>
    </Wrapper>
</template>

<script>
import axios from 'axios';
import Wrapper from '@/js/components/screenshots/Wrapper.vue';
import SalmonRunBox from '@/js/components/splatoon/SalmonRunBox.vue';

export default {
    components: { Wrapper, SalmonRunBox },
    data() {
        return {
            timeline: null,
            salmonruncalendar: null,
        };
    },
    computed: {
        now() {
            return this.$route.params.startTime;
        },
        coop() {
            if (this.timeline && this.timeline.coop && this.timeline.coop.schedule.end_time > this.now)
                return this.timeline.coop;
        },
        coopCalendar() {
            if (this.salmonruncalendar) {
                let schedules = this.salmonruncalendar.schedules.filter(s => s.start_time == this.now);
                if (schedules.length > 0)
                    return schedules;
            }
        },
    },
    created() {
        axios.get('data/timeline.json')
            .then(response => this.timeline = response.data)
        axios.get('data/salmonruncalendar.json')
            .then(response => this.salmonruncalendar = response.data)
    },
}
</script>
