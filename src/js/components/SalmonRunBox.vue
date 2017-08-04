<template>
    <div class="font-splatoon2">
        <h2 class="title is-3 is-size-2-fullhd font-splatoon1">
            Salmon Run
        </h2>
        <div class="is-size-5 title-squid font-splatoon1">
            <span v-if="isOpen">Now open!</span>
            <span v-else>Soon!</span>
        </div>
        <div>
            {{ coop.schedule.start_time | time }} &ndash;
            {{ coop.schedule.end_time | time }}
        </div>
        <div v-if="isOpen">
            {{ coop.schedule.end_time - now | duration }} remaining
        </div>
        <div v-else>
            in {{ coop.schedule.start_time - now | duration }}
        </div>
    </div>
</template>

<script>
import moment from 'moment';

export default {
    props: ['coop', 'now'],
    computed: {
        isOpen() { return this.coop.schedule.start_time <= this.now; },
    },
    filters: {
        time(value) {
            return moment.unix(value).local().format('ha');
        },
        duration(value) {
            let duration = moment.duration(value, 'seconds');
            let hours = Math.floor(duration.asHours());
            let minutes = ('0' + duration.minutes()).substr(-2);
            let seconds = ('0' + duration.seconds()).substr(-2);
            if (hours)
                return `${hours}h ${minutes}m ${seconds}s`;
            return `${minutes}m ${seconds}s`;
        },
    },
}
</script>
