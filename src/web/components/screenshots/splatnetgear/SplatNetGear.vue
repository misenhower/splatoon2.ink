<template>
  <Wrapper v-if="merchandises" title="SplatNet Gear">
    <div class="columns">
      <div class="column is-5" style="min-height: 560px; display: flex; align-items: center; justify-content: center;">
        <MerchandiseBox
          :merchandise="featuredMerchandise"
          class="featured-merchandise"
        />
      </div>

      <div class="column" style="display: flex; align-items: center; justify-content: center;">
        <div class="still-available-merchandise columns is-multiline is-centered">
          <div v-for="(merchandise, index) in otherMerchandises" :key="index" class="column is-one-third">
            <MerchandiseBox
              :merchandise="merchandise"
              :class="(index % 2 == 0) ? 'tilt-right' : 'tilt-left'"
            />
          </div>
        </div>
      </div>
    </div>
  </Wrapper>
</template>

<script>
import Wrapper from '@/web/components/screenshots/Wrapper.vue';
import MerchandiseBox from '@/web/components/splatoon/MerchandiseBox.vue';

export default {
    components: { Wrapper, MerchandiseBox },
    computed: {
        merchandises() {
            return this.$store.getters['splatoon/splatNetStore/merchandises']
                && this.$store.getters['splatoon/splatNetStore/merchandises'].slice().reverse();
        },
        featuredMerchandise() {
            return this.merchandises && this.merchandises[0];
        },
        otherMerchandises() {
            return this.merchandises && this.merchandises.slice(1);
        },
    },
};
</script>
