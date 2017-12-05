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
                            {{ $t('coop.title') }}
                        </h2>
                    </div>
                </div>
            </div>
        </div>

        <div class="columns is-gapless">
            <div class="column is-4 salmon-run-ad-img">
                <div class="image is-16by9 is-hidden-desktop"></div>

                <template v-if="!screenshotMode && coop && coop.reward_gear">
                    <div class="salmon-run-gear-text">
                        {{ $t('coop.this_months_gear') }}
                    </div>
                    <div class="salmon-run-gear-image hand" @click="gearDialogOpen = true" :title="rewardGearName">
                        <div class="image is-32x32">
                            <img :src="coop.reward_gear.gear.image | localSplatNetImageUrl" />
                        </div>
                    </div>
                </template>
            </div>
            <div class="column">
                <div class="salmon-run-content">
                    <div class="salmon-run-open" v-if="currentSchedule">
                        <div class="is-size-5 title-squid font-splatoon1">
                            {{ $t('times.open') }}
                        </div>
                        <template v-if="screenshotMode">
                            <div class="title-color is-size-5">
                                {{ currentSchedule.end_time - now | durationHours | time.remaining }}
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
                                {{ currentSchedule.end_time - now | duration | time.remaining }}
                            </div>
                        </template>

                        <div class="salmon-run-details">
                            <SalmonRunDetailsBar :schedule="currentSchedule"></SalmonRunDetailsBar>
                        </div>
                    </div>

                    <div v-if="!screenshotMode && upcomingSchedules.length > 0">
                        <div class="salmon-run-future">
                            <div class="is-size-6 title-squid font-splatoon1">
                                {{ $t('times.soon') }}
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
                                            <span class="nowrap">
                                                {{ event.start_time | date({ weekday: 'short' }) }}
                                                {{ event.start_time | time }}
                                            </span>
                                            &ndash;
                                            <span class="nowrap">
                                                {{ event.end_time | date }}
                                                {{ event.end_time | time }}
                                            </span>
                                        </span>
                                        <span class="is-size-7 is-hidden-touch is-pulled-right">
                                            {{ event.start_time - now | duration(true) | time.in }}
                                        </span>
                                    </div>
                                </div>

                                <SalmonRunDetailsBar :schedule="event" :mini="true"></SalmonRunDetailsBar>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <SalmonRunGearDialog
            v-if="gearDialogOpen && coop && coop.reward_gear"
            :gear="coop.reward_gear.gear"
            @close="gearDialogOpen = false"
            />
    </div>
</template>

<script>
import Vue from 'vue';
import SalmonRunDetailsBar from './SalmonRunDetailsBar.vue';
import SalmonRunGearDialog from './SalmonRunGearDialog.vue';

export default {
    components: { SalmonRunDetailsBar, SalmonRunGearDialog },
    props: ['coop', 'coopSchedules', 'now', 'screenshotMode'],
    data() {
        return {
            gearDialogOpen: false,
        };
    },
    computed: {
        allSchedules() {
            // Combine the "schedules" and "details" sections into one list of schedules
            let results = {};

            // Add the less-detailed schedules in first
            for (let schedule of this.coopSchedules.schedules)
                results[schedule.start_time] = schedule;

            // Add/replace the schedules that have map/weapon details
            for (let schedule of this.coopSchedules.details)
                results[schedule.start_time] = schedule;

            return Object.values(results).sort((a, b) => { return a.start_time - b.start_time });
        },
        upcomingSchedules() { return this.allSchedules.filter(schedule => schedule.start_time > this.now) },
        currentSchedule() {
            if (this.allSchedules.length > 0 && this.allSchedules[0].start_time <= this.now)
                return this.allSchedules[0];
        },
        rewardGearName() {
            if (this.coop.reward_gear) {
                let gear = this.coop.reward_gear.gear;
                return this.$t(`splatnet.gear.${gear.id}.name`, gear.name);
            }
        },
    },
}
</script>
