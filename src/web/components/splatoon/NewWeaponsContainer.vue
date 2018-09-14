<template>
    <div class="columns is-multiline is-centered">
        <div class="column" :class="columnClass" v-for="(weapon, index) in weapons" :key="weapon.id">
            <NewWeaponBox
                :weapon="weapon"
                :title="title"
                :class="(index % 2 == 0) ? 'tilt-right' : 'tilt-left'"
                />
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import NewWeaponBox from './NewWeaponBox.vue';

export default {
    components: { NewWeaponBox },
    props: {
        maxWeaponsPerRow: {
            type: Number,
            default: 4,
            validator: value => [3, 4].indexOf(value) !== -1,
        },
        title: null,
    },
    computed: {
        ...mapGetters('splatoon/newWeapons', ['weapons']),
        weaponsPerRow() {
            if (!this.weapons)
                return 0;

            let count = Math.min(this.weapons.length, this.maxWeaponsPerRow);

            // If we're only going to have 2 rows and the last row will only have one weapon,
            // reduce the number of weapons per row by one so we don't have an extra one at the end.
            if (this.weapons.length < 2 * count && this.weapons.length % count === 1)
                count--;

            return count;
        },
        columnClass() {
            switch (this.weaponsPerRow) {
                case 2: return 'is-half';
                case 3: return 'is-one-third';
                case 4: return 'is-one-quarter';
            }
        },
    },
};
</script>
