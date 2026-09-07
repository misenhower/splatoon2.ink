<template>
    <div id="screenshots">
        <router-view></router-view>
    </div>
</template>

<script>
import { mapActions } from 'vuex';
import { markScreenshotReady, screenshotReadyAttribute } from '../../common/screenshot.js';

export default {
    data() {
        return { readinessVersion: 0 };
    },
    watch: {
        '$route': {
            handler: 'loadData',
            immediate: true,
        },
    },
    beforeDestroy() {
        this.readinessVersion++;
        document.documentElement.removeAttribute(screenshotReadyAttribute);
    },
    methods: {
        ...mapActions('splatoon', ['setNow']),
        ...mapActions('splatoon/data', ['updateAll']),
        async loadData() {
            let version = ++this.readinessVersion;
            this.setNow({ now: this.$route.params.now || 0 });
            try {
                await markScreenshotReady({
                    loadData: () => this.updateAll(),
                    nextTick: () => this.$nextTick(),
                    isCurrent: () => version === this.readinessVersion,
                });
            } catch (error) {
                // Leave readiness unset: Browser Run should fail/retry instead of capturing
                // a partial page. This also makes failures visible in browser diagnostics.
                console.error('Screenshot is not ready', error);
            }
        },
    },
};
</script>
