<template>
    <Wrapper title="Salmon Run" :time="now">
        <div class="salmon-run tilt-left">
            <div class="hook-box">
                <SalmonRunBox
                    v-if="coopSchedules"
                    :coop="coop"
                    :coopSchedules="filteredCoopSchedules"
                    :now="now"
                    :screenshotMode="true"
                    ></SalmonRunBox>
            </div>
        </div>
    </Wrapper>
</template>

<script>
import axios from 'axios';
import Wrapper from '@/web/components/screenshots/Wrapper.vue';
import SalmonRunBox from '@/web/components/splatoon/SalmonRunBox.vue';

export default {
    components: { Wrapper, SalmonRunBox },
    props: ['startTime'],
    data() {
        return {
            coopSchedules: null,
            timeline: null,
        };
    },
    computed: {
        now() {
            return this.startTime;
        },
        coop() {
            if (this.timeline && this.timeline.coop && this.timeline.coop.schedule.end_time > this.now)
                return this.timeline.coop;
        },
        filteredCoopSchedules() {
            if (this.coopSchedules) {
                let details = this.coopSchedules.details.filter(s => s.start_time == this.now);
                let schedules = this.coopSchedules.schedules.filter(s => s.start_time == this.now);
                return { details, schedules };
            }
        },
    },
    created() {
        axios.get('data/coop-schedules.json')
            .then(response => this.coopSchedules = response.data)
        axios.get('data/timeline.json')
            .then(response => this.timeline = response.data)
    },
}
</script>
