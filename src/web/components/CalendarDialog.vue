<template>
    <Modal @close="$emit('close')">
        <div class="modal-content tilt-left-slight">
            <div class="calendar-box">
                <div class="hook-box">
                    <div class="content">
                        <h3 class="font-splatoon2 title is-3">
                            <div class="image is-pulled-right hero-image is-hidden-touch">
                                <img src="~@/web/assets/img/hero-char-2.png" />
                            </div>
                            Calendar Feeds
                        </h3>
                        <div class="inner-content">
                            <p>
                                Add data from Splatoon2.ink to your calendar!
                            </p>

                            <h4 class="font-splatoon2 title is-4">
                                Salmon Run
                            </h4>
                            <p>
                                <CalendarLink
                                    title="Salmon Run Schedules"
                                    link="data/coop-schedules.ics"
                                    google-id="etra8dks4oo93ofli399hc9f3s1ia97o@import.calendar.google.com"
                                    />
                            </p>

                            <h4 class="font-splatoon2 title is-4">
                                Splatfests
                            </h4>
                            <p>
                                <CalendarLink
                                    :title="$t('regions.na.name')"
                                    link="data/festivals-na.ics"
                                    google-id="5k2jla6mq8nvuprmdbveruolc985hni2@import.calendar.google.com"
                                    />
                                <CalendarLink
                                    :title="$t('regions.eu.name')"
                                    link="data/festivals-eu.ics"
                                    google-id="bihts170jqmilbr1c7c0t52h6qloiutj@import.calendar.google.com"
                                    />
                                <CalendarLink
                                    :title="$t('regions.jp.name')"
                                    link="data/festivals-jp.ics"
                                    google-id="0ue3s3181oo0jakogio082vsa5nu3s99@import.calendar.google.com"
                                    />
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
import analytics from '@/web/analytics';
import Modal from './Modal.vue';
import CalendarLink from './CalendarLink.vue';

export default {
    components: { Modal, CalendarLink },
    mounted() {
        analytics.event('About', 'Open');
    },
}
</script>
