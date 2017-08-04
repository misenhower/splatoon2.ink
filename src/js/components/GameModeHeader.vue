<template>
    <div class="level">
        <div class="level-left">
            <div class="level-item">
                <div class="image is-48x48" style="margin-bottom: -6px">
                    <img v-if="gameMode.key == 'regular'" src="../../img/battle-regular.png" />
                    <img v-if="gameMode.key == 'gachi'" src="../../img/battle-ranked.png" />
                    <img v-if="gameMode.key == 'league'" src="../../img/battle-league.png" />
                </div>
            </div>
            <div class="level-item">
                <h2 class="title is-3 is-size-2-fullhd is-size-4-mobile font-splatoon1">
                    {{ gameMode.name }}
                </h2>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: ['gameMode'],
}
</script>
