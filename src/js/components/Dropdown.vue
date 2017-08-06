<template>
    <div class="dropdown is-right font-splatoon2" :class="{ 'is-active': isOpen }">
        <div class="dropdown-trigger">
            <button class="button is-clear font-splatoon2" @click="isOpen = !isOpen" v-click-outside="hide">
                <span v-if="selectedOption">{{ selectedOption.name }}</span>
                <span class="icon is-small">
                    <span class="chevron bottom"></span>
                </span>
            </button>
        </div>
        <div class="dropdown-menu" role="menu">
            <div class="dropdown-content">
                <a href="#" class="dropdown-item" v-for="option in options" :class="{ 'is-active': option.key == value }" @click.prevent="$emit('input', option.key)">
                    {{ option.name }}
                </a>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: ['options', 'value'],
    data() {
        return {
            isOpen: false,
        };
    },
    computed: {
        selectedOption() {
            if (this.options)
                return this.options.find(option => option.key == this.value);
        },
    },
    methods: {
        hide() {
            this.isOpen = false;
        },
    },
}
</script>
