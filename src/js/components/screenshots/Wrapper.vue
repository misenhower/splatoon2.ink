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
                            <h1 class="title is-3 font-splatoon1 is-inline">Splatoon2.ink</h1>
                        </div>
                    </div>

                    <div class="level-right">
                        <div class="level-item">
                            <div class="has-text-right">
                                <h3 class="subtitle is-4 font-splatoon2 is-inline">{{ title }}</h3>
                                <div class="font-splatoon2 is-size-7 has-text-grey-light">
                                    {{ time | utcDateTime }} UTC
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: ['title', 'time'],
}
</script>
