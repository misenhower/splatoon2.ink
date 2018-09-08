<template>
    <Modal @close="$emit('close')">
        <div class="modal-content">
            <div class="splatnet-gear-dialog">
                <h3 class="title is-3 has-text-centered font-splatoon1 text-shadow">{{ $t('splatnet_gear.title') }}</h3>
                <div class="columns is-marginless is-multiline is-mobile is-centered">
                    <div class="column is-half-mobile is-one-third-tablet" v-for="(merchandise, index) in merchandises" :key="merchandise.end_time">
                        <MerchandiseBox
                            :merchandise="merchandise"
                            :class="(index % 2 === 0) ? 'tilt-left' : 'tilt-right'"
                            />
                    </div>
                </div>
            </div>
        </div>
    </Modal>
</template>

<script>
import { mapGetters } from 'vuex';
import Modal from '@/web/components/Modal.vue';
import MerchandiseBox from './MerchandiseBox.vue';

export default {
    components: { Modal, MerchandiseBox },
    computed: {
        ...mapGetters('splatoon/splatNetStore', ['merchandises']),
    },
};
</script>
