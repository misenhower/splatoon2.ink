<template>
    <div class="bg-stripes" style="background-color: #f54910; margin-bottom: 5px" v-if="shouldShow">
        <div class="container is-fluid">
            <div style="width: 100%; display: flex; align-items: center">
                <div class="has-text-centered" style="flex: 1; margin: 10px">
                    <div>
                        🗳️
                        <strong>VOTE 2020!</strong>
                        Make your voice heard this year!

                        Check
                        <a href="https://vote.gov" target="_blank" style="color: #fff; font-weight: bold">vote.gov</a>
                        and
                        <a href="https://vote.org" target="_blank" style="color: #fff; font-weight: bold">vote.org</a>
                        to get information for your state.
                    </div>
                </div>
                <div style="margin: 5px">
                    <a class="delete" @click.prevent="hide"></a>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            shouldShow: false,
        };
    },
    mounted() {
        this.shouldShow = document.cookie.indexOf('hideVoteBanner=true') === -1;
    },
    methods: {
        hide() {
            // Set a cookie to hide the banner for a few days
            let date = new Date;
            date.setTime(date.getTime() + 3 * 24 * 60 * 60 * 1000);
            document.cookie = 'hideVoteBanner=true;expires=' + date.toGMTString();

            this.shouldShow = false;
        },
    },
}
</script>
