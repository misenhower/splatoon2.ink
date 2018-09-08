<template>
    <Modal @close="$emit('close')" class="font-splatoon2">
        <div class="modal-card schedule-box tilt-left-slight" :class="mode">
            <header class="modal-card-head">
                <GameModeHeader :mode="mode" />
            </header>
            <section class="modal-card-body">
                <ScheduleList :mode="mode" />
            </section>
        </div>
    </Modal>
</template>

<script>
import Modal from '@/web/components/Modal.vue';
import GameModeHeader from './GameModeHeader.vue';
import ScheduleList from './ScheduleList.vue';

export default {
    components: { Modal, GameModeHeader, ScheduleList },
    props: ['mode'],
};
</script>
