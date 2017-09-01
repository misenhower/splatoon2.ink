<template>
    <div class="columns is-mobile">
        <div class="column" v-if="schedule.stage" style="padding-top: 1rem">
            <Stage :stage="schedule.stage"></Stage>
        </div>
        <div class="column is-narrow" style="padding-top: 1rem">
            <template v-if="schedule.weapons">
                <div>Supplied Weapons</div>
                <div class="columns is-gapless is-mobile">
                    <div class="column" v-for="weapon in schedule.weapons">
                        <div class="image is-48x48">
                            <img :src="weapon.image | localSplatNetImageUrl" :title="weapon.name" />
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script>
import Stage from './Stage.vue';

export default {
    components: { Stage },
    props: ['schedule'],
}
</script>
