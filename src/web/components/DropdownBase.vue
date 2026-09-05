<template>
  <div class="dropdown" :class="{ 'is-active': isActive }">
    <div class="dropdown-trigger">
      <a v-click-outside="hide" :class="triggerClass" @click="isActive = !isActive">
        <slot name="trigger">
          <span>{{ label }}</span>
          <span class="icon is-small">
            <span class="chevron bottom" />
          </span>
        </slot>
      </a>
    </div>
    <div class="dropdown-menu" role="menu">
      <div class="dropdown-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script>
export default {
    props: {
        label: null,
        triggerClass: null,
        contentClass: null,
    },
    data() {
        return {
            isActive: false,
        };
    },
    methods: {
        hide() {
            this.isActive = false;
        },
    },
};
</script>
