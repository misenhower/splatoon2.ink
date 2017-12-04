<template>
    <div class="level">
        <div class="level-left">
            <div class="level-item">
                <div class="image is-48x48" style="margin-bottom: -6px">
                    <img v-if="gameMode.key == 'regular'" src="~@/img/battle-regular.png" />
                    <img v-if="gameMode.key == 'gachi'" src="~@/img/battle-ranked.png" />
                    <img v-if="gameMode.key == 'league'" src="~@/img/battle-league.png" />
                </div>
            </div>
            <div class="level-item">
                <h2 class="title is-3 is-size-2-fullhd is-size-4-mobile font-splatoon1">
                    <template>{{ name }}</template>
                </h2>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: ['gameMode', 'festival', 'now'],
    computed: {
        isFestival() {
            return this.festival && this.festival.times.start <= this.now && this.festival.times.end > this.now;
        },
        name() {
            if (this.isFestival)
                return this.$t('splatfest.battle');
            return this.$t(`splatnet.game_modes.${this.gameMode.key}.name`, this.gameMode.name);
        },
    },
}
</script>
