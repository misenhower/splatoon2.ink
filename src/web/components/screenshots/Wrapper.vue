<template>
    <div class="hero is-fullheight" id="main">
        <div class="hero-body">
            <div class="container">
                <slot></slot>
            </div>
        </div>

        <div class="hero-foot">
            <div class="container">
                <div class="level">
                    <div class="level-left">
                        <div class="level-item">
                            <div class="image is-32x32">
                                <img src="~@/web/assets/img/favicon.svg" />
                            </div>
                        </div>
                        <div class="level-item">
                            <h1 class="title is-4 font-splatoon2">{{ title }}</h1>
                        </div>
                        <div class="level-item">&nbsp;</div>
                        <div class="level-item">
                            <div class="font-splatoon2 is-size-7 has-text-grey-light">
                                <div class="image is-24x24 twitter-logo">
                                    <img src="~@/web/assets/img/twitter-white.png" />
                                </div>
                                @splatoon2inkbot
                            </div>
                        </div>
                        <div class="level-item">&nbsp;</div>
                        <div class="level-item">
                            <div class="font-splatoon2 is-size-7 has-text-grey-light">
                                splatoon2.ink
                            </div>
                        </div>
                    </div>

                    <div class="level-right">
                        <div class="level-item">
                            <div class="font-splatoon2 is-size-6 has-text-white">
                                {{ now | dateTime('en', 'UTC', 'MMMM D, YYYY HH:mm z') }}
                            </div>
                        </div>
                        <div class="level-item" v-if="!hideLocalTimes">
                            <div class="font-splatoon2 is-size-7 has-text-grey-light time-table">
                                <table>
                                    <tr>
                                        <td>{{ now | dateTime('en-us', 'America/Los_Angeles') }}</td>
                                        <td>{{ now | dateTime('en-gb', 'Europe/London') }}</td>
                                    </tr>
                                    <tr>
                                        <td>{{ now | dateTime('en-us', 'America/New_York') }}</td>
                                        <td>{{ now | dateTime('ja-jp', 'Asia/Tokyo') }}</td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import moment from 'moment-timezone';

export default {
    props: {
        title: null,
        hideLocalTimes: Boolean,
    },
    filters: {
        dateTime(value, locale, timeZone, format = 'LLL z') {
            let date = moment.unix(value).tz(timeZone);
            date.locale(locale)
            return date.format(format);
        },
    },
    computed: {
        ...mapGetters('splatoon', ['now']),
    },
};
</script>
