<template>
    <div class="font-splatoon2">
        <div class="salmon-run-header">
            <div class="level">
                <div class="level-left">
                    <div class="level-item">
                        <div class="image is-48x48">
                            <img src="~@/img/mr-grizz.png" style="margin-top: -5px" />
                        </div>
                    </div>
                    <div class="level-item">
                        <h2 class="title is-3 is-size-2-fullhd font-splatoon1">
                            Salmon Run
                        </h2>
                    </div>
                </div>
            </div>
        </div>

        <div class="columns is-gapless">
            <div class="column is-4 salmon-run-ad-img">
                <div class="image is-16by9 is-hidden-desktop"></div>
            </div>
            <div class="column">
                <div class="salmon-run-content">
                    <div v-if="currentSchedule">
                        <div class="is-size-5 title-squid font-splatoon1">
                            Now open!
                        </div>
                        <template v-if="screenshotMode">
                            <div class="title-color is-size-5">
                                {{ currentSchedule.end_time - now | durationHours }} remaining
                            </div>
                        </template>
                        <template v-else>
                            <div class="title-color is-size-5">
                                {{ currentSchedule.start_time | date }}
                                {{ currentSchedule.start_time | time }}
                                &ndash;
                                {{ currentSchedule.end_time | date }}
                                {{ currentSchedule.end_time | time }}
                            </div>
                            <div>
                                {{ currentSchedule.end_time - now | duration }} remaining
                            </div>
                        </template>

                        <SalmonRunDetailsBar :schedule="currentSchedule"></SalmonRunDetailsBar>
                    </div>

                    <div v-if="upcomingSchedules.length > 0">
                        <div class="salmon-run-future">
                            <div class="is-size-6 title-squid font-splatoon1">
                                Soon
                            </div>
                            <div v-for="event in upcomingSchedules" class="event">
                                <div class="columns is-marginless is-gapless is-mobile">
                                    <div class="column is-narrow" style="margin-right: 5px">
                                        <div class="image is-4by3" style="width: 23px">
                                            <img src="~@/img/salmon-run-mini.png" />
                                        </div>
                                    </div>
                                    <div class="column">
                                        <span class="title-color is-size-6">
                                            {{ event.start_time | date }}
                                            {{ event.start_time | time }}
                                            &ndash;
                                            {{ event.end_time | date }}
                                            {{ event.end_time | time }}
                                        </span>
                                        <span class="is-size-7 is-hidden-touch is-pulled-right">
                                            in {{ event.start_time - now | duration(true) }}
                                        </span>
                                    </div>
                                </div>

                                <SalmonRunDetailsBar :schedule="event" :mini="true"></SalmonRunDetailsBar>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="upcomingSchedules.length > 0" class="has-text-right calendar-attribution">
                    Salmon Run schedule courtesy of
                    <a href="https://www.reddit.com/r/splatoon/comments/6pgqy4/i_couldnt_find_a_calendar_online_with_a_list_of/" target="_blank">thejellydude</a>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import SalmonRunDetailsBar from './SalmonRunDetailsBar.vue';

export default {
    components: { SalmonRunDetailsBar },
    props: ['coop', 'coopCalendar', 'now', 'screenshotMode'],
    computed: {
        allSchedules() {
            let results = {};

            // "Official" schedule from SplatNet
            if (this.coop && this.coop.schedule.end_time > this.now)
                results[this.coop.schedule.start_time] = this.coop.schedule;

            // Other schedules
            if (this.coopCalendar) {
                for (let schedule of this.coopCalendar)
                    results[schedule.start_time] = schedule;
            }

            return Object.values(results).sort((a, b) => { return a.start_time - b.start_time });
        },
        upcomingSchedules() { return this.allSchedules.filter(schedule => schedule.start_time > this.now) },
        currentSchedule() {
            if (this.allSchedules.length > 0 && this.allSchedules[0].start_time <= this.now)
                return this.allSchedules[0];
        },
    },
}
</script>
