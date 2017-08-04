<template>
    <div class="stage-image" :style="style">
        <figure class=" image is-16by9"></figure>
        <span class="stage-title">{{ stage.name }}</span>
    </div>
</template>

<script>
export default {
    props: ['stage'],
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
