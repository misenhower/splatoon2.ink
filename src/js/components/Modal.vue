<template>
    <transition name="modal">
        <div class="modal is-active" v-portal>
            <div class="modal-background" @click="$emit('close')"></div>
            <div class="modal-inner-transition">
                <slot></slot>
            </div>
            <button class="modal-close is-large" @click="$emit('close')"></button>
        </div>
    </transition>
</template>

<style>
.modal-enter-active, .modal-leave-active {
    transition: all 0.15s ease;
}

.modal-enter, .modal-leave-active {
    opacity: 0;
}

.modal-enter-active .modal-inner-transition, .modal-leave-active .modal-inner-transition {
    transition: all 0.15s ease;
}

.modal-enter .modal-inner-transition, .modal-leave-active .modal-inner-transition {
    -webkit-transform: scale(0.98);
    transform: scale(0.98);
}
</style>

<script>
const openModals = [];

function opened(vm) {
    openModals.push(vm);
    document.body.classList.add('has-modal');
}

function closed(vm) {
    let index = openModals.indexOf(vm);
    if (index > -1)
        openModals.splice(index, 1);
    if (openModals.length === 0)
        document.body.classList.remove('has-modal');
}

export default {
    mounted() {
        opened(this);
    },
    beforeDestroy() {
        closed(this);
    },
}
</script>
