<template>
    <Modal @close="$emit('close')" class="is-wide splatfest-history-dialog modal-rounded-box" v-if="allSplatfests">
        <div class="modal-card">
            <div class="modal-card-head">
                <div class="level">
                    <div class="level-left">
                        <h3 class="title is-3 font-splatoon1 text-shadow">{{ $t('splatfest.previous') }}</h3>
                    </div>

                    <div class="level-right">
                        <Dropdown
                            :options="regions"
                            v-model="region"
                            style="margin: 0 -12px" class="font-splatoon2 is-right-tablet"
                            />
                    </div>
                </div>
            </div>

            <div class="modal-card-body" ref="body">
                <div v-for="(festival, index) in festivals" class="splatfest-history-row" :key="festival.festival_id">
                    <div class="level">
                        <div class="level-item">
                            <div class="splatfest" :class="(index % 2 == 0) ? 'tilt-left' : 'tilt-right'">
                                <div class="hook-box">
                                    <SplatfestBox :festival="festival" history-mode />
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
                                    {{ festival.times.result - now | duration | resultsIn }}
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
import analytics from '@/web/support/analytics';
import Modal from '@/web/components/Modal.vue';
import Dropdown from '@/web/components/Dropdown.vue';
import SplatfestBox from './SplatfestBox.vue';
import SplatfestResultsBox from './SplatfestResultsBox.vue';

export default {
    components: { Modal, Dropdown, SplatfestBox, SplatfestResultsBox },
    filters: {
        resultsIn(time) {
            return Vue.i18n.translate('splatfest.results_in', { time });
        },
    },
    data() {
        return {
            region: 'na',
        };
    },
    computed: {
        ...mapGetters('splatoon', ['now']),
        ...mapGetters('splatoon/regions', { initialRegion: 'selectedKey' }),
        allSplatfests() {
            return {
                na: this.$store.getters['splatoon/splatfests/na/allSplatfests'],
                eu: this.$store.getters['splatoon/splatfests/eu/allSplatfests'],
                jp: this.$store.getters['splatoon/splatfests/jp/allSplatfests'],
            };
        },
        regions() {
            return this.$store.state.splatoon.regions.all.map(({ key }) => {
                let name = (key) ? this.$t(`regions.${key}.name`) : this.$t('regions.global.name');
                return { key, name };
            });
        },
        festivals() {
            return this.allSplatfests[this.region];
        },
    },
    watch: {
        region() {
            this.scrollToTop();
        },
    },
    created() {
        if (this.initialRegion)
            this.region = this.initialRegion;
    },
    mounted() {
        analytics.event('Splatfest History', 'Open');
    },
    methods: {
        scrollToTop() {
            this.$refs.body.scrollTop = 0;
        },
    },
}
</script>
