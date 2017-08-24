<template>
    <Modal @close="$emit('close')">
        <div class="modal-content">
            <div class="splatnet-gear-dialog">
                <h3 class="title is-3 has-text-centered font-splatoon1 text-shadow">Current SplatNet Gear</h3>
                <div class="columns is-marginless is-multiline is-mobile is-centered">
                    <div class="column is-half-mobile is-one-third-tablet" v-for="(merchandise, index) in merchandises">
                        <MerchandiseBox
                            :merchandise="merchandise"
                            :now="now"
                            :class="(index % 2 == 0) ? 'tilt-left' : 'tilt-right'"
                            ></MerchandiseBox>
                    </div>
                </div>
            </div>
        </div>
    </Modal>
</template>

<script>
import analytics from '@/js/analytics';
import Modal from '@/js/components/Modal.vue';
import MerchandiseBox from './MerchandiseBox.vue';

export default {
    components: { Modal, MerchandiseBox },
    props: ['merchandises', 'now'],
    mounted() {
        analytics.event('SplatNet Gear', 'Open');
    },
}
</script>
