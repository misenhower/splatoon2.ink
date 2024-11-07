<template>
    <transition name="modal">
        <div class="modal is-active" v-portal>
            <div class="modal-background" @click="close"></div>
            <slot></slot>
            <button class="modal-close is-large" @click="close"></button>
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
            transform: rotate(-1.0deg) scale(0.98);
        }
        &.tilt-right-slight {
            transform: rotate(1.0deg) scale(0.98);
        }
        transform: scale(0.98);
    }
}
</style>

<script>
// This tracks open modals in order to add/remove the "has-modal" class to the body

const openModals = [];

function opened(vm) {
    openModals.push(vm);

    if (openModals.length === 1) {
        document.body.classList.add('has-modal');
        document.body.addEventListener('keydown', onKeyDown);
    }
}

function closed(vm) {
    let index = openModals.indexOf(vm);
    if (index > -1)
        openModals.splice(index, 1);

    if (openModals.length === 0) {
        document.body.classList.remove('has-modal');
        document.body.removeEventListener('keydown', onKeyDown);
    }
}

function onKeyDown(event) {
    // Close the most recent dialog when the escape key is pressed
    if (event.keyCode === 27) {
        openModals[openModals.length - 1].close();
    }
}

export default {
    mounted() {
        opened(this);
    },
    beforeUnmount() {
        closed(this);
    },
    methods: {
        close() {
            this.$emit('close');
        },
    },
}
</script>
