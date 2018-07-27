<template>
    <div class="stage-image" :class="{ hand: clickable }" :style="style" @click="click" v-if="stageDetails">
        <figure class="image is-16by9"></figure>
        <span class="stage-title" v-if="showTitle">{{ name }}</span>

        <Modal v-if="isOpen" @close="isOpen = false" class="is-xwide">
            <div class="modal-content tilt-right-slight">
                <p class="image is-16by9" @click="isOpen = false">
                    <img :src="largeImage" />
                </p>
                <p class="has-text-centered">
                    <span class="font-splatoon2">
                        {{ name }}
                    </span>
                </p>
            </div>
        </Modal>
    </div>
</template>

<script>
import Vue from 'vue';
import Modal from '@/web/components/Modal.vue';
import SplatoonStages from '@/web/splatoonStages';

export default {
    components: { Modal },
    props: {
        stage: {},
        showTitle: { default: true },
        clickable: { default: true },
        isSalmonRun: { default: false },
    },
    data() {
        return {
            isOpen: false,
        };
    },
    computed: {
        stageDetails() {
            if (this.stage) {
                // Merge our known data with potentially new data from Splatnet
                return Object.assign({}, SplatoonStages.find(stage => stage.id === this.stage.id), this.stage);
            }
        },
        name() {
            if (this.isSalmonRun)
                return this.$t(`splatnet.coop_stages.${this.stage.image}.name`, this.stage.name);

            return this.$t(`splatnet.stages.${this.stageDetails.id}.name`, this.stageDetails.name);
        },
        image() {
            if (this.stageDetails)
                return Vue.filter('localSplatNetImageUrl')(this.stageDetails.image);
        },
        largeImage() {
            if (this.stageDetails)
                return this.stageDetails.largeImage || Vue.filter('localSplatNetImageUrl')(this.stageDetails.image);
        },
        style() {
            return {
                'background-image': `url(${this.image})`,
            };
        },
    },
    methods: {
        click() {
            if (this.clickable)
                this.isOpen = true;
        },
    },
}
</script>
