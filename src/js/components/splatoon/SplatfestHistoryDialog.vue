<template>
    <Modal @close="$emit('close')" class="is-wide splatfest-history-dialog modal-rounded-box">
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Modal>
</template>

<script>
import analytics from '@/js/analytics';
import regions from '@/js/regions';
import Modal from '@/js/components/Modal.vue';
import Dropdown from '@/js/components/Dropdown.vue';
import SplatfestBox from './SplatfestBox.vue';
import SplatfestResultsBox from './SplatfestResultsBox.vue';

export default {
    components: { Modal, Dropdown, SplatfestBox, SplatfestResultsBox },
    props: ['allFestivals', 'now', 'initialRegion'],
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
