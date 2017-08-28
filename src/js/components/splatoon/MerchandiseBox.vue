<template>
    <div class="merchandise-box font-splatoon2" :class="merchandise.kind">
        <div class="brand">
            <div class="image is-32x32">
                <img :src="merchandise.gear.brand.image | localSplatNetImageUrl" :title="merchandise.gear.brand.name" />
            </div>
        </div>

        <div class="skills">
            <div class="main skill-img-bg">
                <img :src="merchandise.skill.image | localSplatNetImageUrl" :title="merchandise.skill.name" />
            </div>
            <div class="sub" v-for="i in merchandise.gear.rarity + 1">
                <img src="~@/img/blank-skill-slot.png" />
            </div>
        </div>

        <div class="is-size-6 title-squid remaining-time">
            {{ merchandise.end_time - now | shortDuration }}
        </div>

        <div class="gear-image">
            <div class="image is-square">
                <img :src="merchandise.gear.image | localSplatNetImageUrl" />
            </div>
        </div>

        <div class="gear-name has-text-centered">
            {{ merchandise.gear.name }}

            <div class="frequent-skill">
                <div class="is-size-7">{{ merchandise.gear.brand.name }}</div>
                <div>
                    <div class="skill-img-bg">
                        <img :src="merchandise.gear.brand.frequent_skill.image | localSplatNetImageUrl" :title="merchandise.gear.brand.frequent_skill.name" />
                    </div>
                    Common Ability
                </div>
            </div>
        </div>

        <div class="bottom-bar has-text-centered">
            <img class="cash" src="~@/img/cash.png" />
            {{ merchandise.price }}
        </div>
    </div>
</template>

<script>
export default {
    props: ['merchandise', 'now'],
}
</script>
