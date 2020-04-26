import User from '../../modules/user';

export const PERMANENT_BAN = -1;

export default {
  namespaced: true,

  state: {
    user: null,
    token: null,
    commands: [],
    banLeftSeconds: 0,
  },

  mutations: {
    setUser(state, userData) {
      state.user = userData;
    },

    setToken(state, token) {
      state.token = token;
    },

    setCommands(state, commands) {
      state.commands = commands;
    },

    setActivityStatus(state, status) {
      state.user.activityStatus = status;
    },

    setBanLeftSeconds(state, leftSeconds) {
      state.banLeftSeconds = leftSeconds;
    },
  },

  actions: {
    signIn({ commit }, { user, token }) {
      commit('setUser', user);
      commit('setToken', token);
    },

    signOut({ commit }) {
      commit('setUser', null);
      commit('setToken', null);
      commit('setCommands', []);
    },

    async ban({ dispatch, commit }, banMinutes = PERMANENT_BAN) {
      if (banMinutes === PERMANENT_BAN) {
        commit('setBanLeftSeconds', banMinutes);
        return banMinutes;
      }

      commit('setBanLeftSeconds', banMinutes * 60);
      return dispatch('countdownBan');
    },

    countdownBan({ state, commit }) {
      return new Promise((resolve) => {
        if (state.banLeftSeconds === 0 || state.banLeftSeconds === PERMANENT_BAN) {
          resolve(state.banLeftSeconds);
          return;
        }

        const initialBanSeconds = state.banLeftSeconds;
        const interval = setInterval(() => {
          let { banLeftSeconds } = state;
          banLeftSeconds -= 1;
          if (banLeftSeconds < 0) {
            clearInterval(interval);
            resolve(initialBanSeconds);
            return;
          }

          commit('setBanLeftSeconds', banLeftSeconds);
        }, 1000);
      });
    },
  },

  getters: {
    userObj({ user }) {
      if (!user) return null;
      return new User(user);
    },

    msgInputCommands({ commands }) {
      return commands.filter(({ isManualCommand }) => isManualCommand);
    },

    isBanned({ banLeftSeconds }) {
      return banLeftSeconds > 0 || banLeftSeconds === PERMANENT_BAN;
    },
  },
};
