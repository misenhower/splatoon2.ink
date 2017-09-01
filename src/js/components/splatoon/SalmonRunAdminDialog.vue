<template>
    <Modal class="font-splatoon2" @close="$emit('close')">
        <div class="modal-content" style="width: 1200px; min-height: 600px">
            <div class="columns is-marginless">
                <div class="column">
                    <div class="panel">
                        <p class="panel-heading">Salmon Run Times</p>
                        <a class="panel-block" v-for="event in coopCalendar" :class="{'is-active': selectedStartTime == event.start_time}" @click="selectedStartTime = event.start_time">
                            <div style="width: 100%">
                            <div>
                                {{ event.start_time | date }}
                                {{ event.start_time | time }}
                                &ndash;
                                {{ event.end_time | date }}
                                {{ event.end_time | time }}
                                </div>

                                <div class="columns">
                                    <div class="column is-one-quarter" v-if="stageSelections[event.start_time]">
                                        <a @click="clearStage(event.start_time)">
                                            <Stage :stage="stageSelections[event.start_time]" :clickable="false"></Stage>
                                        </a>
                                    </div>
                                    <div class="column">
                                        <div class="columns is-multiline" v-if="weaponSelections[event.start_time]">
                                            <div class="column is-narrow" v-for="weapon in weaponSelections[event.start_time]">
                                                <div class="image is-64x64 hand" @click="removeWeapon(event.start_time, weapon)">
                                                    <img :src="weapon.image | localSplatNetImageUrl" :title="weapon.name" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>

                    <textarea class="textarea" style="height: 100%" :value="output" readonly @focus="$event.target.select()"></textarea>
                </div>

                <div class="column">
                    <div class="columns">
                        <div class="column" v-for="stage in stages">
                            <a @click="setStage(stage)">
                                <Stage :stage="stage" :clickable="false"></Stage>
                            </a>
                        </div>
                    </div>
                    <div class="field">
                        <div class="control">
                            <input class="input" placeholder="Search weapons..." v-model="weaponSearchTerm" />
                        </div>
                    </div>
                    <div class="columns is-multiline is-mobile" v-if="filteredWeapons">
                        <div class="column is-narrow" v-for="weapon in filteredWeapons">
                            <div class="image is-64x64 hand" @click="addWeapon(weapon)">
                                <img :src="weapon.image | localSplatNetImageUrl" :title="weapon.name" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Modal>
</template>

<script>
import axios from 'axios';
import Vue from 'vue';
import Modal from '@/js/components/Modal.vue';
import Stage from '@/js/components/splatoon/Stage.vue';
import SplatoonStages from '@/js/splatoonStages';

export default {
    components: { Modal, Stage },
    props: ['coopCalendar'],
    data() {
        return {
            weapons: null,
            stages: [
                SplatoonStages.find(stage => stage.id == '999901'),
                SplatoonStages.find(stage => stage.id == '999902'),
                SplatoonStages.find(stage => stage.id == '999903'),
            ],
            weaponSearchTerm: '',
            selectedStartTime: null,
            stageSelections: {},
            weaponSelections: {},
        };
    },
    computed: {
        filteredWeapons() {
            if (this.weapons)
                return Object.values(this.weapons).filter(weapon => weapon.name.toLowerCase().indexOf(this.weaponSearchTerm) > -1);
        },
        output() {
            let schedules = this.coopCalendar.map(event => {
                let schedule = Object.assign({}, event);
                delete schedule.stage;
                delete schedule.weapons;

                let stage = this.stageSelections[event.start_time];
                if (stage)
                    schedule.stage = { id: stage.id, name: stage.name };

                let weapons = this.weaponSelections[event.start_time];
                if (weapons && weapons.length)
                    schedule.weapons = weapons;

                return schedule;
            });
            return JSON.stringify(schedules);
        },
    },
    created() {
        this.updateWeapons();

        // Load existing weapon/map selections
        for (event of this.coopCalendar) {
            if (event.stage)
                Vue.set(this.stageSelections, event.start_time, Object.assign({}, event.stage));
            if (event.weapons)
                Vue.set(this.weaponSelections, event.start_time, event.weapons.slice());
        }
    },
    methods: {
        updateWeapons() {
            axios.get('/data/weapons.json')
                .then(response => this.weapons = response.data);
        },
        setStage(stage) {
            if (this.selectedStartTime)
                Vue.set(this.stageSelections, this.selectedStartTime, stage);
        },
        clearStage(startTime) {
            Vue.delete(this.stageSelections, startTime);
        },
        addWeapon(weapon) {
            if (!this.selectedStartTime)
                return;

            if (!this.weaponSelections[this.selectedStartTime])
                Vue.set(this.weaponSelections, this.selectedStartTime, []);

            this.weaponSelections[this.selectedStartTime].push(weapon);

            this.weaponSearchTerm = '';
        },
        removeWeapon(startTime, weapon) {
            let index = this.weaponSelections[startTime].indexOf(weapon);
            this.weaponSelections[startTime].splice(index, 1);
        },
    },
}
</script>
