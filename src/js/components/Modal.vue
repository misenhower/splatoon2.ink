<template>
    <transition name="modal">
        <div class="modal is-active" v-portal>
            <div class="modal-background" @click="$emit('close')"></div>
            <slot></slot>
            <button class="modal-close is-large" @click="$emit('close')"></button>
        </div>
    </transition>
</template>

<style lang="scss">
.modal-enter-active, .modal-leave-active {
    &, &>.modal-content, &>.modal-card {
        transition: all 0.15s ease;
    }
}

.modal-enter, .modal-leave-active {
    opacity: 0;

    &>.modal-content, &>.modal-card {
        &.tilt-left-slight {
            -webkit-transform: rotate(-1.0deg) scale(0.98);
            transform: rotate(-1.0deg) scale(0.98);
        }
        &.tilt-right-slight {
            -webkit-transform: rotate(1.0deg) scale(0.98);
            transform: rotate(1.0deg) scale(0.98);
        }
        -webkit-transform: scale(0.98);
        transform: scale(0.98);
    }
}
</style>

<script>
// This tracks open modals in order to add/remove the "has-modal" class to the body

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
