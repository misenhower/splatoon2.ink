<template>
    <div class="stage-image hand" :style="style" @click="isOpen = true">
        <figure class="image is-16by9"></figure>
        <span class="stage-title">{{ stage.name }}</span>

        <div class="modal is-active" v-if="isOpen" v-portal>
            <div class="modal-background" @click="isOpen = false"></div>
                <div class="modal-content">
                    <p class="image is-16by9">
                        <img :src="image" />
                    </p>
                    <p class="has-text-centered">
                        <span class="font-splatoon2">
                            {{ stage.name }}
                        </span>
                    </p>
                </div>
            <button class="modal-close is-large" @click="isOpen = false"></button>
        </div>
    </div>
</template>

<script>
export default {
    props: ['stage'],
    data() {
        return {
            isOpen: false,
        };
    },
    computed: {
        image() {
            if (this.stage)
                return `https://app.splatoon2.nintendo.net${this.stage.image}`;
        },
        style() {
            return {
                'background-image': `url(${this.image})`,
            };
        },
    },
}
</script>
