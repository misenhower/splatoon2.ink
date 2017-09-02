<template>
    <div class="stage-image" :class="{ hand: clickable }" :style="style" @click="click" v-if="stageDetails">
        <figure class="image is-16by9"></figure>
        <span class="stage-title" v-if="showTitle">{{ stageDetails.name }}</span>

        <Modal v-if="isOpen" @close="isOpen = false">
            <div class="modal-content tilt-right-slight is-wide">
                <p class="image is-16by9" @click="isOpen = false">
                    <img :src="largeImage" />
                </p>
                <p class="has-text-centered">
                    <span class="font-splatoon2">
                        {{ stageDetails.name }}
                    </span>
                </p>
            </div>
        </Modal>
    </div>
</template>

<style>
.modal-content.is-wide {
    width: 1200px;
}
</style>

<script>
import Vue from 'vue';
import Modal from '@/js/components/Modal.vue';
import SplatoonStages from '@/js/splatoonStages';

export default {
    components: { Modal },
    props: {
        stage: {},
        showTitle: { default: true },
        clickable: { default: true },
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
        image() {
            if (this.stageDetails)
                return Vue.filter('localSplatNetImageUrl')(this.stageDetails.image);
        },
        largeImage() {
            if (this.stageDetails)
                return Vue.filter('localSplatNetImageUrl')(this.stageDetails.largeImage || this.stageDetails.image);
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
