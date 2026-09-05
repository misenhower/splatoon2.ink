<template>
  <div class="font-splatoon2" :class="mode">
    <GameModeHeader :mode="mode" />

    <div v-if="activeSchedule" class="main-schedule">
      <div class="level is-mobile top-bar">
        <div class="level-left">
          <div class="level-item title-color is-size-5">
            {{ activeRuleName }}
          </div>
        </div>
        <div class="level-right">
          <div class="level-item">
            {{ activeSchedule.start_time | time }} &ndash;
            {{ activeSchedule.end_time | time }}
          </div>
        </div>
      </div>
      <div class="is-clearfix" />
      <div class="columns is-mobile is-slim">
        <div class="column">
          <Stage :stage="activeSchedule.stage_a" />
        </div>
        <div class="column">
          <Stage :stage="activeSchedule.stage_b" />
        </div>
        <template v-if="selectedRegionHasActiveSplatfest">
          <div class="column">
            <Stage :stage="selectedRegionCurrentSplatfest.special_stage" />
          </div>
        </template>
      </div>
    </div>

    <template v-if="upcomingSchedules && upcomingSchedules[0]">
      <div class="is-size-5 title-squid font-splatoon1">
        {{ $t('times.next') }}
      </div>

      <ScheduleRow :schedule="upcomingSchedules[0]" is-small />
    </template>

    <p class="has-text-centered" style="margin-top: 10px">
      <router-link :to="`/schedules/${mode}`" class="button is-translucent is-rounded">
        <span class="icon squid-icon-tilt">
          <span class="fa squid-squid" />
        </span>
        <span class="font-splatoon2">{{ $t('ui.all_upcoming_stages') }}</span>
      </router-link>
    </p>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import GameModeHeader from './GameModeHeader.vue';
import Stage from './Stage.vue';
import ScheduleRow from './ScheduleRow.vue';

export default {
    components: { GameModeHeader, Stage, ScheduleRow },
    props: ['mode'],
    computed: {
        ...mapGetters('splatoon', ['now']),
        ...mapGetters('splatoon/splatfests', [
            'selectedRegionCurrentSplatfest',
            'selectedRegionHasActiveSplatfest',
        ]),

        activeSchedule() {
            return this.$store.getters[`splatoon/schedules/${this.mode}/activeSchedule`];
        },
        upcomingSchedules() {
            return this.$store.getters[`splatoon/schedules/${this.mode}/upcomingSchedules`];
        },
        activeRuleName() {
            if (this.activeSchedule) {
                let rule = this.activeSchedule.rule;
                return this.$t(`splatnet.rules.${rule.key}.name`, rule.name);
            }
            return null;
        },
    },
};
</script>
