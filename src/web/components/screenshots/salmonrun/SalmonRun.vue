<template>
    <Wrapper title="Salmon Run">
        <div class="salmon-run tilt-left">
            <div class="hook-box">
                <SalmonRunBox screenshot-mode />
            </div>
        </div>
    </Wrapper>
</template>

<script>
import Wrapper from '@/web/components/screenshots/Wrapper.vue';
import SalmonRunBox from '@/web/components/splatoon/SalmonRunBox.vue';

export default {
    components: { Wrapper, SalmonRunBox },
};
</script>
