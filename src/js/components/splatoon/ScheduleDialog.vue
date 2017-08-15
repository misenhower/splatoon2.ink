<template>
    <Modal @close="$emit('close')" class="font-splatoon2">
        <div class="modal-card schedule-box tilt-left-slight" :class="cssClass">
            <header class="modal-card-head">
                <GameModeHeader :gameMode="gameMode"></GameModeHeader>
            </header>
            <section class="modal-card-body">
                <ScheduleList :schedules="schedules" :now="now"></ScheduleList>
            </section>
        </div>
    </Modal>
</template>

<script>
import Modal from '@/js/components/Modal.vue';
import GameModeHeader from './GameModeHeader.vue';
import ScheduleList from './ScheduleList.vue';

export default {
    components: { Modal, GameModeHeader, ScheduleList },
    props: ['schedules', 'gameMode', 'cssClass', 'now'],
}
</script>
