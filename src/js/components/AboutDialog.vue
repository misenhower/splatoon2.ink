<template>
    <Modal @close="$emit('close')">
        <div class="modal-content tilt-left-slight">
            <div class="about-box">
                <div class="hook-box">
                    <div class="content">
                        <h3 class="font-splatoon2 title is-3">
                            <div class="image is-pulled-right hero-image is-hidden-touch">
                                <img src="~@/img/hero-char.png" />
                            </div>
                            Hello!
                        </h3>
                        <div class="inner-content">
                            <p>
                                Splatoon2.ink shows the current and upcoming map schedules for
                                <a href="https://www.amazon.com/gp/product/B01N9QVIRV/ref=as_li_tl?ie=UTF8&amp;tag=matisesblo-20&amp;camp=1789&amp;creative=9325&amp;linkCode=as2&amp;creativeASIN=B01N9QVIRV&amp;linkId=01d5f076af5b6008436d9843c40a28db" target="_blank">Splatoon 2</a>.
                            </p>
                            <p>
                                This site was built with <a href="https://vuejs.org/" target="_blank">Vue.js</a>
                                and <a href="http://bulma.io/" target="_blank">Bulma</a>.
                                Data comes from the SplatNet 2 API and other manually-maintained sources.
                            </p>
                            <p>
                                Original SplatNet gear ability/price data comes from
                                <a href="https://splatoonwiki.org/wiki/Gear#In_Splatoon_2" target="_blank">Inkipedia</a>.
                            </p>
                            <p>
                                Source code for this site is available on
                                <a href="https://github.com/misenhower/splatoon2.ink" target="_blank">GitHub</a>.
                            </p>
                            <p>
                                <a href="https://twitter.com/mattisenhower" target="_blank">Follow me on Twitter</a>
                                or <a href="mailto:matt@isenhower.com" target="_blank">email me</a> with any questions!
                            </p>
                            <h5 class="font-splatoon2 title is-5">Notes &amp; Issues</h5>
                            <p>
                                <strong>Salmon Run:</strong>
                                The SplatNet API doesn't provide a way to see maps, available weapons, or upcoming Salmon Run times.
                                Upcoming times and weapons are manually entered.
                            </p>
                            <p>
                                <strong>Splatfests:</strong>
                                Only North American Splatfests are updated automatically.
                                There may be a slight delay in updating Splatfest schedules for other regions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Modal>
</template>

<style scoped>
.modal-content {
    max-height: 100vh;
}

.hero-image {
    z-index: 1;
}

.inner-content {
    position: relative;
    z-index: 2;
}
</style>

<script>
import analytics from '@/js/analytics';
import Modal from './Modal.vue';

export default {
    components: { Modal },
    mounted() {
        analytics.event('About', 'Open');
    },
}
</script>
