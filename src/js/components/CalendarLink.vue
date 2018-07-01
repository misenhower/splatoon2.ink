<template>
    <div class="dropdown" :class="{ 'is-active': isOpen }">
        <div class="dropdown-trigger">
            <a :href="directLink" class="button is-link is-rounded" :class="{ 'tooltip is-tooltip-right is-tooltip-active': showTooltip }" data-tooltip="Copied!" @click.prevent="isOpen = !isOpen" v-click-outside="hide">
                <span class="font-splatoon2">{{ title }}</span>
                <span class="icon is-small">
                    <span class="chevron bottom"></span>
                </span>
            </a>
        </div>
        <div class="dropdown-menu" role="menu">
            <div class="dropdown-content font-splatoon2 has-text-left">
                <a :href="googleLink" target="_blank" class="dropdown-item">
                    Google Calendar
                </a>
                <a :href="webcalLink" target="_blank" class="dropdown-item">
                    Apple Calendar/Outlook
                </a>
                <a :href="directLink" target="_blank" class="dropdown-item" @click.prevent.stop="hide" v-clipboard:copy="directLink" v-clipboard:success="onCopy">
                    Copy ICS Link
                </a>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: ['title', 'link', 'googleId'],
    data() {
        return {
            isOpen: false,
            showTooltip: false,
        };
    },
    computed: {
        googleLink() {
            return `https://www.google.com/calendar/render?cid=${this.googleId}`;
        },
        webcalLink() {
            return `webcal://splatoon2.ink/${this.link}`;
        },
        directLink() {
            return `https://splatoon2.ink/${this.link}`;
        },
    },
    methods: {
        hide() {
            this.isOpen = false;
            this.showTooltip = false;
        },
        onCopy() {
            this.showTooltip = true;
        },
    },
};
</script>
