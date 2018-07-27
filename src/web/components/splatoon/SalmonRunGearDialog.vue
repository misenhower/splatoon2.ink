<template>
    <Modal @close="$emit('close')">
        <div class="modal-content" style="max-width: 300px; overflow: visible">
            <div class="tilt-right" style="overflow: hidden">
                <MerchandiseBox :merchandise="merchandise" class="salmon-run-gear" />
            </div>
        </div>
    </Modal>
</template>

<script>
import Modal from '@/web/components/Modal.vue';
import MerchandiseBox from './MerchandiseBox.vue';

export default {
    components: { Modal, MerchandiseBox },
    props: ['gear'],
    computed: {
        merchandise() { return { gear: this.gear }; },
    },
}
</script>
