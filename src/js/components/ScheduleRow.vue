<template>
    <div>
        <div class="level is-mobile is-marginless is-hidden-tablet">
            <div class="level-left">
                <div class="level-item title-color is-size-5">{{ schedule.rule.name }}</div>
            </div>
            <div class="level-right">
                <div class="level-item">
                    <template v-if="schedule.start_time > now">
                        in {{ schedule.start_time - now | duration }},
                    </template>
                    {{ schedule.start_time | time }} &ndash;
                    {{ schedule.end_time | time }}
                </div>
            </div>
        </div>

        <div class="columns is-slim" v-if="schedule">
            <div class="column has-text-centered is-hidden-mobile" style="margin-top: auto; margin-bottom: auto;">
                <div class="title is-6 is-size-5-fullhd is-size-5-touch">{{ schedule.rule.name }}</div>
                <div class="subtitle is-7 is-size-6-fullhd is-size-6-touch">
                    <template v-if="schedule.start_time > now">
                        in {{ schedule.start_time - now | duration }}
                        <br />
                    </template>
                    <template v-if="!isToday">
                        {{ schedule.start_time | date }}
                    </template>
                    {{ schedule.start_time | time }} &ndash;
                    {{ schedule.end_time | time }}
                </div>
            </div>
            <div class="column is-8">
                <div class="columns is-mobile is-slim">
                    <div class="column"><Stage :stage="schedule.stage_a"></Stage></div>
                    <div class="column"><Stage :stage="schedule.stage_b"></Stage></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Stage from './Stage.vue';

export default {
    components: { Stage },
    props: ['schedule', 'now'],
    computed: {
        isToday() {
            let now = new Date(this.now * 1000);
            let start = new Date(this.schedule.start_time * 1000);
            return (now.getDate() == start.getDate() && now.getMonth() == start.getMonth() && now.getFullYear() == start.getFullYear());
        }
    }
}
</script>
