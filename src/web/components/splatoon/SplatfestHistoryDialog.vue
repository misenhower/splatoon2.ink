<template>
    <Modal @close="$emit('close')" class="is-wide splatfest-history-dialog modal-rounded-box" v-if="allFestivals">
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
                <div v-for="(info, index) in festivals" class="splatfest-history-row" :key="info.festival.festival_id">
                    <div class="level">
                        <div class="level-item">
                            <div class="splatfest" :class="(index % 2 == 0) ? 'tilt-left' : 'tilt-right'">
                                <div class="hook-box">
                                    <SplatfestBox
                                        :festival="info.festival"
                                        :now="now"
                                        :historyMode="true"
                                        />
                                </div>
                            </div>
                        </div>

                        <div class="level-item">
                            <div class="splatfest-results-container">
                                <SplatfestResultsBox
                                    v-if="info.results"
                                    :festival="info.festival"
                                    :results="info.results"
                                    :historyMode="true"
                                    />

                                <div v-else-if="info.festival.times.result > now" class="has-text-centered font-splatoon2 is-size-5">
                                    {{ info.festival.times.result - now | duration | resultsIn }}
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
import analytics from '@/web/support/analytics';
import * as regions from '@/common/regions.esm';
import Modal from '@/web/components/Modal.vue';
import Dropdown from '@/web/components/Dropdown.vue';
import SplatfestBox from './SplatfestBox.vue';
import SplatfestResultsBox from './SplatfestResultsBox.vue';

export default {
    components: { Modal, Dropdown, SplatfestBox, SplatfestResultsBox },
    props: ['allFestivals', 'now', 'initialRegion'],
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
        regions() {
            return regions.splatoonRegions.filter(({ key }) => key).map(({ key }) => {
                let name = (key) ? this.$t(`regions.${key}.name`) : this.$t('regions.global.name');
                return { key, name };
            });
        },
        festivals() {
            let data = this.allFestivals[this.region];

            return data.festivals.map(festival => {
                let results = data.results.find(r => r.festival_id == festival.festival_id);
                return { festival, results };
            });
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
