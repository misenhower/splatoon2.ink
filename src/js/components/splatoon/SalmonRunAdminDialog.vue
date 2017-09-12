<template>
    <Modal class="font-splatoon2" @close="$emit('close')">
        <div class="modal-content" style="width: 1200px; min-height: 600px">
            <div class="columns is-marginless">
                <div class="column">
                    <div class="panel">
                        <p class="panel-heading">Salmon Run Times</p>
                        <a class="panel-block" v-for="event in schedules" :class="{'is-active': event == selectedSchedule}" @click="selectedSchedule = event">
                            <div style="width: 100%">
                                <div>
                                    {{ event.start_time | date }}
                                    {{ event.start_time | time }}
                                    &ndash;
                                    {{ event.end_time | date }}
                                    {{ event.end_time | time }}
                                </div>

                                <div class="columns">
                                    <div class="column is-one-quarter" v-if="event.stage">
                                        <a @click="clearStage(event)">
                                            <Stage :stage="event.stage" :clickable="false"></Stage>
                                        </a>
                                    </div>
                                    <div class="column">
                                        <div class="columns is-multiline" v-if="event.weapons">
                                            <div class="column is-narrow" v-for="weapon in event.weapons">
                                                <div class="image is-64x64 hand" @click="removeWeapon(event, weapon)">
                                                    <img :src="weapon.image | localSplatNetImageUrl" :title="weapon.name" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button class="button is-small is-danger" @click="removeSchedule(event)">&times;</button>
                        </a>

                        <div class="panel-block">
                            <div class="select">
                                <select v-model="selectedStartDate">
                                    <option v-for="date in dates" :value="date">{{ date | date }}</option>
                                </select>
                            </div>

                            <div class="select">
                                <select v-model="selectedStartTime">
                                    <option v-for="time in times" :value="time">{{ time | time }}</option>
                                </select>
                            </div>

                            &nbsp;&ndash;&nbsp;

                            <div class="select">
                                <select v-model="selectedEndDate">
                                    <option v-for="date in dates" :value="date">{{ date | date }}</option>
                                </select>
                            </div>

                            <div class="select">
                                <select v-model="selectedEndTime">
                                    <option v-for="time in times" :value="time">{{ time | time }}</option>
                                </select>
                            </div>

                            <button class="button is-primary" @click="addSchedule">Add</button>
                        </div>
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
            schedules: null,
            selectedSchedule: null,
            dates: [],
            times: [],
            selectedStartDate: null,
            selectedStartTime: null,
            selectedEndDate: null,
            selectedEndTime: null,
        };
    },
    computed: {
        filteredWeapons() {
            if (this.weapons)
                return Object.values(this.weapons).filter(weapon => weapon.name.toLowerCase().indexOf(this.weaponSearchTerm) > -1);
        },
        output() {
            return JSON.stringify(this.schedules);
        },
    },
    created() {
        // Set up dates/times
        for (let i = 0; i < 20; i++) {
            let date = new Date;
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            date.setDate(date.getDate() + i);
            this.dates.push(Math.floor(date.getTime() / 1000));
        }
        this.selectedStartDate = this.dates[0];
        this.selectedEndDate = this.dates[0];

        for (let i = 0; i < 24; i++) {
            let date = new Date;
            date.setHours(i);
            date.setMinutes(0);
            date.setSeconds(0);
            this.times.push(Math.floor(date.getTime() / 1000));
        }
        this.selectedStartTime = this.times[0];
        this.selectedEndTime = this.times[0];

        // Update weapons
        this.updateWeapons();

        // Load existing weapon/map selections
        this.schedules = (this.coopCalendar) ? JSON.parse(JSON.stringify(this.coopCalendar)) : [];
    },
    methods: {
        updateWeapons() {
            axios.get('/data/weapons.json')
                .then(response => this.weapons = response.data);
        },
        setStage(stage) {
            if (this.selectedSchedule)
                Vue.set(this.selectedSchedule, 'stage', stage);
        },
        clearStage(schedule) {
            Vue.delete(schedule, 'stage');
        },
        addWeapon(weapon) {
            if (!this.selectedSchedule)
                return;

            if (!this.selectedSchedule.weapons)
                Vue.set(this.selectedSchedule, 'weapons', []);

            this.selectedSchedule.weapons.push(weapon);

            this.weaponSearchTerm = '';
        },
        removeWeapon(schedule, weapon) {
            let index = schedule.weapons.indexOf(weapon);
            schedule.weapons.splice(index, 1);

            if (!schedule.weapons.length)
                Vue.delete(schedule, 'weapons');
        },
        removeSchedule(schedule) {
            let index = this.schedules.indexOf(schedule);
            this.schedules.splice(index, 1);
        },
        addSchedule() {
            let startTime = new Date(this.selectedStartDate * 1000);
            startTime.setHours((new Date(this.selectedStartTime * 1000)).getHours());

            let endTime = new Date(this.selectedEndDate * 1000);
            endTime.setHours((new Date(this.selectedEndTime * 1000)).getHours());

            this.schedules.push({
                start_time: Math.floor(startTime.getTime() / 1000),
                end_time: Math.floor(endTime.getTime() / 1000),
            })
        },
    },
}
</script>
