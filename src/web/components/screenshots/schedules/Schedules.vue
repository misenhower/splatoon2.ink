<template>
    <Wrapper title="Map Schedules">
        <div class="columns font-splatoon2">
            <div class="column">
                <ScheduleBox class="main-schedule-box tilt-left" mode="regular" />
            </div>

            <div class="column">
                <ScheduleBox class="main-schedule-box tilt-right" mode="ranked" />
            </div>

            <div class="column">
                <ScheduleBox class="main-schedule-box tilt-left" mode="league" />
            </div>
        </div>
    </Wrapper>
</template>

<script>
import Wrapper from '@/web/components/screenshots/Wrapper.vue';
import ScheduleBox from './ScheduleBox.vue';

export default {
    components: { Wrapper, ScheduleBox },
};
</script>
