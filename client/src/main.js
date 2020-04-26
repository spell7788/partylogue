import Vue from 'vue';
import VueSocketIO from 'vue-socket.io';
import VueTippy, { TippyComponent } from 'vue-tippy';
import App from './App.vue';
import router from './router';
import store from './store';
import connection from './connection';

// eslint-disable-next-line import/no-webpack-loader-syntax
import '!vue-style-loader!css-loader!sass-loader!./assets/scss/global.scss';

const isProduction = process.env.NODE_ENV === 'production';

Vue.config.productionTip = false;

Vue.use(VueTippy);
Vue.component('tippy', TippyComponent);

Vue.use(new VueSocketIO({
  debug: !isProduction,
  connection,
  vuex: {
    store,
  },
}));

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app');
