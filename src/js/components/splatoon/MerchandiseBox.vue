<template>
    <div class="merchandise-box font-splatoon2" :class="merchandise.kind">
        <div class="brand">
            <div class="image is-32x32">
                <img :src="merchandise.gear.brand.image | localSplatNetImageUrl" :title="merchandise.gear.brand.name" />
            </div>
        </div>

        <div class="skills">
            <div class="main skill-img-bg" v-if="merchandise.skill">
                <img :src="merchandise.skill.image | localSplatNetImageUrl" :title="merchandise.skill.name" />
            </div>
            <div class="sub" v-for="i in merchandise.gear.rarity + 1">
                <img src="~@/img/blank-skill-slot.png" />
            </div>
        </div>

        <div class="is-size-6 title-squid remaining-time" v-if="merchandise.end_time">
            {{ merchandise.end_time - now | shortDuration }}
        </div>

        <div class="gear-image">
            <div class="image is-square">
                <img :src="merchandise.gear.image | localSplatNetImageUrl" />
            </div>
        </div>

        <div class="gear-name has-text-centered">
            {{ merchandise.gear.name }}

            <div class="info-overlay">
                <div class="info-overlay-container original-gear" v-if="merchandise.original_gear">
                    <div class="is-size-7">Original Gear</div>

                    <div class="level" style="margin: 0 3px">
                        <div class="level-left">
                            <div class="level-item">
                                <div class="skill-img-bg strikethrough">
                                    <img :src="merchandise.original_gear.skill.image | localSplatNetImageUrl" :title="merchandise.original_gear.skill.name" />
                                </div>
                                <div class="sub" v-for="i in merchandise.original_gear.rarity + 1">
                                    <img src="~@/img/blank-skill-slot.png" />
                                </div>
                            </div>
                        </div>
                        <div class="level-right" v-if="merchandise.original_gear.price">
                            <div class="level-item">
                                <div>
                                    <img class="cash" src="~@/img/cash.png" />
                                    <span class="strikethrough">{{ merchandise.original_gear.price }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="info-overlay-container common-ability" v-if="merchandise.gear.brand.frequent_skill">
                    <div class="is-size-7">{{ merchandise.gear.brand.name }}</div>
                    <div>
                        <div class="skill-img-bg">
                            <img :src="merchandise.gear.brand.frequent_skill.image | localSplatNetImageUrl" :title="merchandise.gear.brand.frequent_skill.name" />
                        </div>
                        Common Ability
                    </div>
                </div>
            </div>
        </div>

        <div class="bottom-bar has-text-centered" v-if="merchandise.price">
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
