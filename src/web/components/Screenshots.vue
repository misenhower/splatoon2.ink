<template>
    <div id="screenshots">
        <router-view></router-view>
    </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
    watch: {
        '$route': {
            handler: 'loadData',
            immediate: true,
        },
    },
    methods: {
        ...mapActions('splatoon', ['setNow']),
        ...mapActions('splatoon/data', ['updateAll']),
        loadData() {
            this.setNow({ now: this.$route.params.now || 0 });
            this.updateAll();
        },
    },
};
</script>
