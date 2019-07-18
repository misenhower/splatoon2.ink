<template>
    <div>
        <div class="level is-mobile is-marginless is-hidden-tablet">
            <div class="level-left">
                <template v-if="ruleName">
                    <div class="level-item title-color is-size-5">{{ ruleName }}</div>
                </template>
                <template v-else>
                    {{ timeFromNow }}
                </template>
            </div>
            <div class="level-right">
                <div class="level-item has-text-right">
                    <div>
                        <template v-if="ruleName && schedule.start_time > now">
                            {{ timeFromNow }}<span class="is-hidden-mobile">,&nbsp;</span>
                        </template>
                        <div class="is-size-7">
                            <template v-if="showStartDate">
                                {{ schedule.start_time | date }}
                            </template>
                            {{ schedule.start_time | time }} &ndash;
                            <template v-if="showEndDate">
                                {{ schedule.end_time | date }}
                            </template>
                            {{ schedule.end_time | time }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="columns is-slim" v-if="schedule">
            <div class="column has-text-centered is-hidden-mobile" style="margin-top: auto; margin-bottom: auto;">
                <div class="title is-size-5-fullhd is-size-5-touch" :class="ruleNameClass">{{ ruleName }}</div>
                <div class="subtitle is-size-6-fullhd is-size-6-touch" :class="scheduleClass">
                    <template v-if="schedule.start_time > now">
                        {{ timeFromNow }}
                        <br />
                    </template>
                    <template v-if="showStartDate">
                        {{ schedule.start_time | date }}
                    </template>
                    <span class="nowrap">{{ schedule.start_time | time }}</span>
                    &ndash;
                    <template v-if="showEndDate">
                        {{ schedule.end_time | date }}
                    </template>
                    <span class="nowrap">{{ schedule.end_time | time }}</span>
                </div>
            </div>
            <div class="column is-8">
                <div class="columns is-mobile is-slim">
                    <div class="column"><Stage :stage="schedule.stage_a" v-if="schedule.stage_a" /></div>
                    <div class="column"><Stage :stage="schedule.stage_b" v-if="schedule.stage_b" /></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from 'vue';
import { mapGetters } from 'vuex';
import Stage from './Stage.vue';

function isSameDay(timestamp1, timestamp2) {
    let date1 = new Date(timestamp1 * 1000);
    let date2 = new Date(timestamp2 * 1000);
    return (date1.getDate() == date2.getDate() && date1.getMonth() == date2.getMonth() && date1.getFullYear() == date2.getFullYear());
}

export default {
    components: { Stage },
    props: {
        schedule: null,
        isSmall: Boolean,
    },
    computed: {
        ...mapGetters('splatoon', ['now']),
        showStartDate() {
            return !isSameDay(this.now, this.schedule.start_time);
        },
        showEndDate() {
            return !isSameDay(this.schedule.start_time, this.schedule.end_time);
        },
        ruleName() {
            let rule = this.schedule.rule;
            if (rule)
                return this.$t(`splatnet.rules.${rule.key}.name`, rule.name);
        },
        ruleNameClass() { return this.isSmall ? 'is-6' : 'is-5' },
        scheduleClass() { return this.isSmall ? 'is-7' : 'is-6' },
        timeFromNow() {
            let time = Vue.filter('duration')(this.schedule.start_time - this.now);
            return this.$t('time.in', { time });
        },
    }
}
</script>
