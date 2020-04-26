import Vue from 'vue';
import { USER_ROLE } from '@/consts';
import User from '@/modules/user';

export default {
  namespaced: true,

  state: {
    id: null,
    host: null,
    title: null,
    isPrivate: null,
    users: [],
    messages: [],
    inputMsg: '',
  },

  mutations: {
    // eslint-disable-next-line object-curly-newline
    setChatRoom(state, { id, host, title, isPrivate, users, messages }) {
      state.id = id;
      state.host = host;
      state.title = title;
      state.isPrivate = isPrivate;
      state.users = users;
      state.messages = messages;
    },

    addMessage({ messages }, msg) {
      messages.push(msg);
    },

    updateTitle(state, title) {
      state.title = title;
    },

    addUser({ users }, user) {
      users.push(user);
    },

    removeUser({ users }, userId) {
      const i = this.getters['chatRoom/userIds'].indexOf(userId);
      if (i === -1) return;
      users.splice(i, 1);
    },

    setUserActivityStatus(state, [userId, status]) {
      const i = this.getters['chatRoom/userIds'].indexOf(userId);
      if (i === -1) return;
      state.users[i].activityStatus = status;
    },

    setUserRole({ users }, { userId, role }) {
      const i = this.getters['chatRoom/userIds'].indexOf(userId);
      if (i === -1) return;
      const { roles } = users[i];
      if (role.length > 0) {
        const [roomId, newRole] = role;
        roles.roles[roomId] = newRole;
      } else {
        roles.global = role;
      }
      Vue.set(users[i], 'roles', roles);
    },

    setInputMessage(state, msg) {
      state.inputMsg = msg;
    },
  },

  actions: {
    appendToMessage({ state, commit }, text) {
      commit('setInputMessage', state.inputMsg + text);
    },
  },

  getters: {
    getUser({ users }, { userIds }) {
      return (userId) => {
        const i = userIds.indexOf(userId);
        if (i === -1) return;
        // eslint-disable-next-line consistent-return
        return users[i];
      };
    },

    userIds({ users }) {
      return users.map(user => user.id);
    },

    sortedUsers({ id: roomId, users }) {
      return [...users].sort((user, other) => {
        const userObj = new User(user);
        const otherObj = new User(other);

        if (userObj.getDominantRole(roomId) === USER_ROLE.HOST) return -1;
        if (otherObj.getDominantRole(roomId) === USER_ROLE.HOST) return 1;

        const compared = userObj.compareDominantRoles(otherObj, roomId);
        const bothOnline = user.isOnline && other.isOnline;
        const bothOffline = !user.isOnline && !other.isOnline;
        if (bothOffline || bothOnline) {
          if (compared === 0) return 0;
          return compared;
        }

        if (user.isOnline && !other.isOnline) {
          if (compared === 0) return -1;
          return compared;
        }

        if (compared === 0) return 1;
        return compared;
      });
    },
  },
};
