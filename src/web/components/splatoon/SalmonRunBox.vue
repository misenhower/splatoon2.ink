<template>
    <div class="font-splatoon2">
        <div class="salmon-run-header">
            <div class="level">
                <div class="level-left">
                    <div class="level-item">
                        <div class="image is-48x48">
                            <img src="~@/web/assets/img/mr-grizz.png" style="margin-top: -5px" />
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

                <template v-if="rewardGear">
                    <div class="salmon-run-gear-text">
                        {{ $t('coop.current_gear') }}
                    </div>
                    <div class="salmon-run-gear-image hand" @click="gearDialogOpen = true" :title="rewardGearName">
                        <div class="image is-32x32">
                            <img :src="rewardGear.image | localSplatNetImageUrl" />
                        </div>
                    </div>
                </template>
            </div>
            <div class="column">
                <div class="salmon-run-content">
                    <div class="salmon-run-open" v-if="activeSchedule">
                        <div class="is-size-5 title-squid font-splatoon1">
                            {{ $t('times.open') }}
                        </div>
                        <template v-if="screenshotMode">
                            <div class="title-color is-size-5">
                                {{ activeSchedule.end_time - now | durationHours | time.remaining }}
                            </div>
                        </template>
                        <template v-else>
                            <div class="title-color is-size-5">
                                {{ activeSchedule.start_time | date }}
                                {{ activeSchedule.start_time | time }}
                                &ndash;
                                {{ activeSchedule.end_time | date }}
                                {{ activeSchedule.end_time | time }}
                            </div>
                            <div>
                                {{ activeSchedule.end_time - now | duration | time.remaining }}
                            </div>
                        </template>

                        <div class="salmon-run-details">
                            <SalmonRunDetailsBar :schedule="activeSchedule" />
                        </div>
                    </div>

                    <div v-if="!screenshotMode && upcomingSchedules.length > 0">
                        <div class="salmon-run-future">
                            <div class="is-size-6 title-squid font-splatoon1">
                                {{ $t('times.soon') }}
                            </div>
                            <div v-for="event in upcomingSchedules" :key="event.key" class="event">
                                <div class="columns is-marginless is-gapless is-mobile">
                                    <div class="column is-narrow" style="margin-right: 5px">
                                        <div class="image is-4by3" style="width: 23px">
                                            <img src="~@/web/assets/img/salmon-run-mini.png" />
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

                                <SalmonRunDetailsBar :schedule="event" mini />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <SalmonRunGearDialog
            v-if="gearDialogOpen && rewardGear"
            @close="gearDialogOpen = false"
            />
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import SalmonRunDetailsBar from './SalmonRunDetailsBar.vue';
import SalmonRunGearDialog from './SalmonRunGearDialog.vue';

export default {
    components: { SalmonRunDetailsBar, SalmonRunGearDialog },
    props: {
        screenshotMode: Boolean,
    },
    data() {
        return {
            gearDialogOpen: false,
        };
    },
    computed: {
        ...mapGetters('splatoon', ['now']),
        ...mapGetters('splatoon/salmonRun', ['activeSchedule', 'upcomingSchedules', 'rewardGear']),
        rewardGearName() {
            if (this.rewardGear)
                return this.$t(`splatnet.gear.${this.rewardGear.kind}.${this.rewardGear.id}.name`, this.rewardGear.name);
        },
    },
}
</script>
