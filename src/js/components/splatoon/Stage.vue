<template>
    <div class="stage-image hand" :style="style" @click="isOpen = true">
        <figure class="image is-16by9"></figure>
        <span class="stage-title">{{ stage.name }}</span>

        <Modal v-if="isOpen" @close="isOpen = false">
            <div class="modal-content tilt-right-slight">
                <p class="image is-16by9">
                    <img :src="image" />
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

<script>
import Modal from '@/js/components/Modal.vue';

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
            if (this.stage) {
                let filename = this.stage.image.replace(/^.*[\\\/]/, '');
                return `/assets/img/splatnet/${filename}`;
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
