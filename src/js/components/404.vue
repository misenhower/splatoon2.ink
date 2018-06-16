<template>
    <div class="hero is-fullheight">
        <div class="hero-body">
            <!-- 404! -->
            <div class="error404 tilt-left">
                <div class="hook-box">
                    <div class="box-header">
                        <h2 class="title is-3 is-size-2-fullhd font-splatoon1">
                            404 Not Found
                        </h2>
                    </div>

                    <img src="~@/img/404.jpg" />

                    <div class="box-footer">
                        <p class="has-text-centered">
                            <router-link to="/" class="button is-translucent is-rounded">
                                <span class="icon squid-icon-tilt">
                                    <span class="fa squid-squid"></span>
                                </span>
                                <span class="font-splatoon2">
                                    Return to Splatoon2.ink
                                </span>
                            </router-link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
