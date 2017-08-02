<template>
    <div>
        <h4 class="title is-4">{{ stage.name }}</h4>
        <img :src="image" />
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
    },
}
</script>
