import mentionSound from '@/assets/click.mp3';

function makeTypedAlert(type, icon) {
  return ({ dispatch }, { msg, routeTo, opts }) => {
    dispatch('alert', {
      // eslint-disable-next-line object-curly-newline
      alert: { type, routeTo, icon, msg },
      opts,
    });
  };
}

const mentionAudio = new Audio(mentionSound);
const mentionAlert = makeTypedAlert('mention', '📮');

const ALERT_RESETED_STATE = {
  type: null,
  routeTo: null,
  icon: null,
  msg: '',
};

export default {
  namespaced: true,

  state: {
    alert: ALERT_RESETED_STATE,
  },

  mutations: {
    setAlert(state, alertObj) {
      state.alert = alertObj;
    },

    resetAlert(state) {
      state.alert = ALERT_RESETED_STATE;
    },
  },

  actions: {
    alert({ commit }, {
      alert,
      opts: { autohide = true, hangTime = process.env.VUE_APP_ALERT_HANG_MINUTES } = {},
    }) {
      const hangTimeMs = hangTime * 1000;
      return new Promise((resolve) => {
        commit('setAlert', alert);

        if (autohide) {
          setTimeout(() => {
            commit('resetAlert');
            resolve();
          }, hangTimeMs);
        } else {
          resolve();
        }
      });
    },

    ok: makeTypedAlert('ok', '👍'),
    fail: makeTypedAlert('fail', '👎'),
    info: makeTypedAlert('info', 'ℹ'),

    mention(...args) {
      mentionAudio.play();
      return mentionAlert(...args);
    },
  },
};
