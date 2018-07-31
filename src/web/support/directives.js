import Vue from 'vue';

// v-click-outside is used to hide dropdown menus.
import vClickOutside from 'v-click-outside';
Vue.use(vClickOutside);

import VueClipboard from 'vue-clipboard2';
Vue.use(VueClipboard);

// Simple v-portal directive to push modal popups to the end of the DOM.
// This helps when launching a popup inside of an element with position: relative.
Vue.directive('portal', {
    inserted(el) {
        document.body.appendChild(el);
    }
});
