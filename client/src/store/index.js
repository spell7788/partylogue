import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import { user, chatRoom, alert } from './modules';

Vue.use(Vuex);

export default new Vuex.Store({
  strict: true,
  modules: {
    user,
    chatRoom,
    alert,
  },
  plugins: [
    createPersistedState({
      paths: [
        'user.user',
        'user.token',
        'user.commands',
        'user.banLeftSeconds',
      ],
    }),
  ],
});
