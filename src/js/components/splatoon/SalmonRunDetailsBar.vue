<template>
    <div class="columns is-mobile is-slimmer" style="padding: 0.5rem 0" v-if="schedule.stage || schedule.weapons">
        <div class="column" :class="mini ? 'is-3' : 'is-5'" v-if="schedule.stage">
            <Stage :stage="schedule.stage" :isSalmonRun="true" :showTitle="!mini"></Stage>
        </div>

        <div class="column" style="display: flex; align-items: center;" v-if="mini && schedule.stage">
            {{ stageName }}
        </div>

        <div class="column" :class="{ 'is-5': mini }" style="display: flex; align-items: center;" v-if="schedule.weapons">
            <div style="width: 100%">
                <div class="has-text-centered" v-if="!mini">Supplied Weapons</div>

                <div class="columns is-mobile is-slimmer">
                    <div class="column" v-for="weapon in schedule.weapons">
                        <div class="image is-square weapon">
                            <img :src="weapon.image | localSplatNetImageUrl" :title="$t(`splatnet.weapons.${weapon.id}.name`, weapon.name)" v-if="weapon" />
                            <img src="~@/img/salmon-run-random-weapon.png" title="Random" style="padding: 8px" v-else />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Stage from './Stage.vue';

export default {
    components: { Stage },
    props: ['schedule', 'mini'],
    computed: {
        stageName() {
            let stage = this.schedule.stage;
            return this.$t(`splatnet.coop_stages.${stage.image}.name`, stage.name);
        },
    },
}
</script>
