<template>
    <div class="modal is-active" v-portal>
        <div class="modal-background" @click="$emit('close')"></div>
        <slot />
        <button class="modal-close is-large" @click="$emit('close')"></button>
    </div>
</template>

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
