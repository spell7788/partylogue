import Vue from 'vue';
import VueRouter from 'vue-router';

import ChatRoomList from '@/views/ChatRoomList.vue';
import ChatRoom from '@/views/ChatRoom.vue';
import CreateChatRoom from '@/views/CreateChatRoom.vue';
import Register from '@/views/Register.vue';
import store from '../store';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'chatRoomList',
    component: ChatRoomList,
  },
  {
    path: '/create',
    name: 'createChatRoom',
    component: CreateChatRoom,
  },
  {
    path: '/register',
    name: 'register',
    component: Register,
  },
  {
    path: '/:id',
    name: 'chatRoom',
    component: ChatRoom,
  },

  // {
  //   path: '/about',
  //   name: 'about',
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
  // },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { x: 0, y: 0 };
  },
});

router.beforeEach((to, from, next) => {
  store.commit('alert/resetAlert');
  next();
});

export default router;
