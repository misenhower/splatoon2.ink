<template>
    <div class="new-weapon-box font-splatoon2">

        <div class="font-splatoon1 is-size-5 title-squid">
            {{ title }}
        </div>

        <div class="main-content-wrapper">
            <div class="weapon-special-sub">
                <div class="image-wrapper" :title="specialName">
                    <div class="image is-24x24">
                        <img :src="weapon.special.image_a | localSplatNetImageUrl" />
                    </div>
                </div>

                <div class="image-wrapper" :title="subName">
                    <div class="image is-24x24">
                        <img :src="weapon.sub.image_a | localSplatNetImageUrl" />
                    </div>
                </div>
            </div>

            <div class="image is-square">
                <img :src="weapon.image | localSplatNetImageUrl" />
            </div>

            <div class="weapon-name has-text-centered is-size-5">
                {{ name }}
            </div>
        </div>

    </div>
</template>

<script>
export default {
    props: {
        weapon: {},
        title: { default: 'New Weapon' },
    },
    computed: {
        name() {
            return this.$t(`splatnet.weapons.${this.weapon.id}.name`, this.weapon.name);
        },
        subName() {
            let sub = this.weapon.sub;
            return 'Sub: ' + this.$t(`splatnet.weapon_subs.${sub.id}.name`, sub.name);
        },
        specialName() {
            let special = this.weapon.special;
            return 'Special: ' + this.$t(`splatnet.weapon_specials.${special.id}.name`, special.name);
        },
    }
}
</script>
