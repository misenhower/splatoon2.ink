<template>
  <div class="merchandise-box font-splatoon2" :class="merchandise.kind">
    <div class="brand">
      <div class="image is-32x32">
        <img :src="merchandise.gear.brand.image | localSplatNetImageUrl" :title="brandName" />
      </div>
    </div>

    <div class="skills">
      <div v-if="merchandise.skill" class="main skill-img-bg">
        <img :src="merchandise.skill.image | localSplatNetImageUrl" :title="skillName" />
      </div>
      <div v-for="i in merchandise.gear.rarity + 1" :key="i" class="sub">
        <img src="~@/web/assets/img/blank-skill-slot.png" />
      </div>
    </div>

    <div v-if="merchandise.end_time" class="is-size-6 title-squid remaining-time">
      {{ merchandise.end_time - now | shortDuration }}
    </div>

    <div class="gear-image">
      <div class="image is-square">
        <img :src="merchandise.gear.image | localSplatNetImageUrl" />
      </div>
    </div>

    <div class="gear-name has-text-centered">
      {{ gearName }}

      <div class="info-overlay">
        <div v-if="merchandise.original_gear" class="info-overlay-container original-gear">
          <div class="is-size-7">
            {{ $t('splatnet_gear.original_gear') }}
          </div>

          <div class="level" style="margin: 0 3px">
            <div class="level-left">
              <div class="level-item">
                <div class="skill-img-bg strikethrough">
                  <img :src="merchandise.original_gear.skill.image | localSplatNetImageUrl" :title="originalSkillName" />
                </div>
                <div v-for="i in merchandise.original_gear.rarity + 1" :key="i" class="sub">
                  <img src="~@/web/assets/img/blank-skill-slot.png" />
                </div>
              </div>
            </div>
            <div v-if="merchandise.original_gear.price" class="level-right">
              <div class="level-item">
                <div>
                  <img class="cash" src="~@/web/assets/img/cash.png" />
                  <span class="strikethrough">{{ merchandise.original_gear.price }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="merchandise.gear.brand.frequent_skill" class="info-overlay-container common-ability">
          <div class="is-size-7">
            {{ $t('gear.frequent_ability') }}
          </div>
          <div>
            <div class="skill-img-bg">
              <img :src="merchandise.gear.brand.frequent_skill.image | localSplatNetImageUrl" :title="frequentSkillName" />
            </div>
            {{ brandName }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="merchandise.price" class="bottom-bar has-text-centered">
      <img class="cash" src="~@/web/assets/img/cash.png" />
      {{ merchandise.price }}
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    props: ['merchandise'],
    computed: {
        ...mapGetters('splatoon', ['now']),
        brandName() {
            let brand = this.merchandise.gear.brand;
            return this.$t(`splatnet.brands.${brand.id}.name`, brand.name);
        },
        skillName() {
            let skill = this.merchandise.skill;
            return this.$t(`splatnet.skills.${skill.id}.name`, skill.name);
        },
        originalSkillName() {
            let originalGear = this.merchandise.original_gear;
            if (originalGear)
                return this.$t(`splatnet.skills.${originalGear.skill.id}.name`, originalGear.skill.name);
            return null;
        },
        frequentSkillName() {
            let frequentSkill = this.merchandise.gear.brand.frequent_skill;
            return this.$t(`splatnet.skills.${frequentSkill.id}.name`, frequentSkill.name);
        },
        gearName() {
            let gear = this.merchandise.gear;
            return this.$t(`splatnet.gear.${gear.kind}.${gear.id}.name`, gear.name);
        },
    },
};
</script>
