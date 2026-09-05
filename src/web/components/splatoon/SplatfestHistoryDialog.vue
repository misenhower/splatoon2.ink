<template>
  <Modal v-if="festivals" class="is-wide splatfest-history-dialog modal-rounded-box" @close="$emit('close')">
    <div class="modal-card">
      <div class="modal-card-head">
        <div class="level">
          <div class="level-left">
            <h3 class="title is-3 font-splatoon1 text-shadow">
              {{ $t('splatfest.previous') }}
            </h3>
          </div>

          <div class="level-right">
            <DropdownBase
              :label="selectedRegion.name"
              style="margin: 0 -12px"
              class="font-splatoon2 is-right-tablet"
              trigger-class="button is-clear font-splatoon2"
            >
              <router-link
                v-for="regionOption in regions"
                :key="regionOption.key"
                class="dropdown-item"
                :to="regionOption.route"
                exact
              >
                {{ regionOption.name }}
              </router-link>
            </DropdownBase>
          </div>
        </div>
      </div>

      <div ref="body" class="modal-card-body">
        <div v-if="!region" class="columns idol-results">
          <div class="column has-text-right is-hidden-mobile has-idol">
            <img src="~@/web/assets/img/pearl.png" width="173" height="290" />
          </div>
          <div class="column is-5">
            <div class="is-hidden-mobile" style="height: 85px" />
            <div class="idol-results-container">
              <IdolResultsBox />
            </div>
          </div>
          <div class="column has-text-left is-hidden-mobile has-idol">
            <img src="~@/web/assets/img/marina.png" width="172" height="339" />
          </div>
        </div>

        <div v-for="(festival, index) in festivals" :key="festival.festival_id" class="splatfest-history-row">
          <div class="level">
            <div class="level-item">
              <div class="splatfest show-regions" :class="(index % 2 == 0) ? 'tilt-left' : 'tilt-right'">
                <div class="hook-box">
                  <SplatfestBox :festival="festival" history-mode show-regions />
                </div>
              </div>
            </div>

            <div class="level-item">
              <div class="splatfest-results-container">
                <SplatfestResultsBox
                  v-if="festival.results"
                  :festival="festival"
                  :results="festival.results"
                  history-mode
                />

                <div v-else-if="festival.times.result > now" class="has-text-centered font-splatoon2 is-size-5">
                  <div>{{ festival.times.result - now | duration | resultsIn }}</div>
                  <div>
                    {{ festival.times.result | date }}
                    {{ festival.times.result | time }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script>
import Vue from 'vue';
import { mapGetters } from 'vuex';
import Modal from '@/web/components/Modal.vue';
import DropdownBase from '@/web/components/DropdownBase.vue';
import IdolResultsBox from './IdolResultsBox.vue';
import SplatfestBox from './SplatfestBox.vue';
import SplatfestResultsBox from './SplatfestResultsBox.vue';

export default {
    components: { Modal, DropdownBase, IdolResultsBox, SplatfestBox, SplatfestResultsBox },
    filters: {
        resultsIn(time) {
            return Vue.i18n.translate('splatfest.results_in', { time });
        },
    },
    props: {
        region: String,
    },
    computed: {
        ...mapGetters('splatoon', ['now']),
        regions() {
            return this.$store.state.splatoon.regions.all.map(({ key }) => {
                let name = (key) ? this.$t(`regions.${key}.name`) : this.$t('regions.global.name');
                let route = (key) ? `/splatfests/${key}` : '/splatfests';
                return { key, name, route };
            });
        },
        selectedRegion() {
            let key = this.region || null;
            return this.regions.find(r => r.key === key);
        },
        festivals() {
            if (this.region)
                return this.$store.getters[`splatoon/splatfests/${this.region}/allSplatfests`];
            return this.$store.getters['splatoon/splatfests/allSplatfests'];
        },
    },
    watch: {
        region() {
            this.scrollToTop();
        },
    },
    methods: {
        scrollToTop() {
            this.$refs.body.scrollTop = 0;
        },
    },
};
</script>
