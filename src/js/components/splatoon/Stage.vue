<template>
    <div class="stage-image hand" :style="style" @click="isOpen = true">
        <figure class="image is-16by9"></figure>
        <span class="stage-title">{{ stage.name }}</span>

        <Modal v-if="isOpen" @close="isOpen = false">
            <div class="modal-content tilt-right-slight is-wide">
                <p class="image is-16by9" @click="isOpen = false">
                    <img :src="largeImage" />
                </p>
                <p class="has-text-centered">
                    <span class="font-splatoon2">
                        {{ stage.name }}
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
    props: ['stage'],
    data() {
        return {
            isOpen: false,
        };
    },
    computed: {
        image() {
            if (this.stage)
                return Vue.filter('localSplatNetImageUrl')(this.stage.image);
        },
        largeImage() {
            if (this.stage) {
                let stage = SplatoonStages.find(stage => stage.id === this.stage.id);

                if (stage && stage.largeImage)
                    return stage.largeImage;

                return this.image;
            }
        },
        style() {
            return {
                'background-image': `url(${this.image})`,
            };
        },
    },
}
</script>
