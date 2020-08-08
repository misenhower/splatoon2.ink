<template>
    <div class="columns is-mobile is-slimmer salmon-run-details" style="padding: 0.5rem 0" v-if="schedule.stage || schedule.weapons">
        <div class="column" :class="mini ? 'is-3' : 'is-5'" v-if="schedule.stage">
            <Stage :stage="schedule.stage" is-salmon-run :showTitle="!mini"></Stage>
        </div>

        <div class="column" style="display: flex; align-items: center;" v-if="mini && schedule.stage">
            {{ stageName }}
        </div>

        <div class="column" :class="{ 'is-5': mini }" style="display: flex; align-items: center;" v-if="schedule.weapons">
            <div style="width: 100%">
                <div class="has-text-centered" v-if="!mini">{{ $t('coop.supplied_weapons') }}</div>

                <div class="columns is-mobile is-slimmer">
                    <div class="column" v-for="(weapon, i) in schedule.weapons" :key="i">
                        <div class="image is-square weapon">
                            <template v-if="weapon.weapon">
                                <img
                                    :src="weapon.weapon.image | localSplatNetImageUrl"
                                    :title="$t(`splatnet.weapons.${weapon.weapon.id}.name`, weapon.weapon.name)"
                                    />
                            </template>

                            <template v-else-if="weapon.coop_special_weapon">
                                <img
                                    :src="weapon.coop_special_weapon.image | localSplatNetImageUrl"
                                    :title="$t(`splatnet.coop_special_weapons.${weapon.coop_special_weapon.image}.name`, weapon.coop_special_weapon.name)"
                                    />
                            </template>

                            <template v-else>
                                <img src="~@/web/assets/img/salmon-run-random-weapon.png" :title="$t('coop.random_weapon')" style="padding: 8px" />
                            </template>
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
    props: {
        schedule: null,
        mini: Boolean,
    },
    computed: {
        stageName() {
            let stage = this.schedule.stage;
            return this.$t(`splatnet.coop_stages.${stage.image}.name`, stage.name);
        },
    },
}
</script>
