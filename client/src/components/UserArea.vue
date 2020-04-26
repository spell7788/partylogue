<template>
  <div :class="$style.user">
    <Router-link
      :to="{ name: 'createChatRoom' }"
      :class="$style.createRoomLink"
    >
      new room
    </Router-link>

    <ActivityIndicator :user="user" />

    <span :class="$style.username">
      {{ user.username }}
    </span>

    <a
      :class="$style.signOutButton"
      @click="signOut"
    >
      sign out
    </a>
  </div>
</template>

<style lang="scss" module>
.user {
  @extend %flex-defaults;
  align-items: baseline;
}

.createRoomLink {
  @extend %button;
  background: $yellow;
  margin-right: 1rem;
}

.username {
  margin-left: .5rem;
  margin-right: 1rem;
  font-weight: bold;
}

.signOutButton {
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    color: $red !important;
  }
}
</style>

<script>
import { mapState, mapGetters } from 'vuex';
import ActivityIndicator from './UserActivityIndicator.vue';

export default {
  name: 'UserArea',

  components: {
    ActivityIndicator,
  },

  computed: {
    ...mapState('user', ['user']),
    ...mapGetters('user', ['userObj']),
  },

  methods: {
    async signOut() {
      await this.$socket.emit('sign out');
      delete this.$socket.io.opts.query.token;
      this.$store.dispatch('user/signOut');
      if (this.$route.name !== 'chatRoomList') {
        this.$router.push({ name: 'chatRoomList' });
      }
    },
  },

  sockets: {
    'new mention'(message) {
      const msg = `
        new mention by ${message.sender.username}
        in room "${message.room.title}".
      `.trim();
      this.$store.dispatch('alert/mention', {
        msg,
        routeTo: {
          name: 'chatRoom',
          params: { id: message.room.id },
          hash: `#msg${message.id}`,
        },
        opts: { autohide: false },
      });
    },

    'user activity status'({ userId, status }) {
      if (userId !== this.user.id) return;
      this.$store.commit('user/setActivityStatus', status);
    },

    'banned'(banMinutes) {
      this.$store.dispatch('user/ban', banMinutes || undefined);
      this.$store.dispatch('alert/info', { msg: 'you have been banned' });
    },

    'unbanned'() {
      this.$store.commit('user/setBanLeftSeconds', 0);
    },
  },
};
</script>
