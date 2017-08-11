<template>
    <div class="font-splatoon2">
        <div class="salmon-run-header">
            <div class="level">
                <div class="level-left">
                    <div class="level-item">
                        <div class="image is-48x48">
                            <img src="../../img/mr-grizz.png" style="margin-top: -5px" />
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
            <div class="column is-5">
                <div class="image is-16by9">
                    <img src="../../img/salmon-run.png" style="z-index: 1" />
                </div>
            </div>
            <div class="column">
                <div class="salmon-run-content">
                    <div class="is-size-5 title-squid font-splatoon1">
                        <span v-if="isOpen">Now open!</span>
                        <span v-else>Soon!</span>
                    </div>
                    <div class="title-color is-size-5">
                        {{ coop.schedule.start_time | date }}
                        {{ coop.schedule.start_time | time }}
                        &ndash;
                        {{ coop.schedule.end_time | date }}
                        {{ coop.schedule.end_time | time }}
                    </div>
                    <div v-if="isOpen">
                        {{ coop.schedule.end_time - now | duration }} remaining
                    </div>
                    <div v-else>
                        in {{ coop.schedule.start_time - now | duration }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: ['coop', 'now'],
    computed: {
        isOpen() { return this.coop.schedule.start_time <= this.now; },
    },
}
</script>
