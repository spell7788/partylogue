<template>
  <div :class="$style.room">
    <div :class="$style.meta">
      <span
        :title="isPrivate ? 'Private room' : 'Public room'"
        :class="$style.publicity"
      >
        {{ isPrivate ? '🔒' : '🌐' }}
      </span>

      <Title :room-id="$route.params.id" />

      <div
        v-if="user"
        :class="$style.actions"
      >
        <button
          :class="$style.shareButton"
          @click="share"
        >
          share
        </button>

        <button
          :class="$style.leaveButton"
          @click="leaveRoom"
        >
          leave
        </button>
      </div>
    </div>

    <div :class="$style.messagesArea">
      <TheAlert :class="$style.alert" />

      <MessagesContainer />
    </div>

    <div :class="$style.users">
      <User
        v-for="user in sortedUsers"
        :key="user.id"
        :room-id="$route.params.id"
        :user-id="user.id"
      />
    </div>

    <MessageInput
      :room-id="$route.params.id"
      :class="$style.input"
    />
  </div>
</template>

<style lang="scss" module>
.room {
  height: 100%;
  display: grid;
  grid-template-areas:
    "meta users"
    "messages users"
    "input input";
  grid-template-columns: 1fr $room-users-column-width;
  grid-template-rows: 1fr minmax(100px, 80%) minmax(50px, .8fr);

  @include mobile {
    grid-template-areas:
      "meta meta"
      "messages users"
      "input input";
  }
}

.meta {
  @extend %flex-defaults;
  border-top-left-radius: $view-border-radius;
  padding: 1rem 1.2rem;
  background: $lightgrey;

  @include mobile {
    grid-column: 1 / 3;
  }
}

.publicity {
  margin-right: 10px;
}

.actions {
  @extend %flex-defaults;
}

.shareButton {
  @extend %button, %buttonSmall;
  background: $green;
  color: $light;
  margin-right: .5rem;
}

.leaveButton {
  @extend %button, %buttonSmall;
}

.messagesArea {
  grid-area: messages;
  position: relative;
}

.alert {
  position: absolute;
  top: 10px;
  left: 20px;
  right: 20px;
  z-index: 1;
}

.users {
  grid-area: users;
}

.input {
  grid-area: input;
}
</style>

<script>
import { mapState, mapGetters } from 'vuex';
import { dateFormatMixin, copyTextMixin } from '@/mixins';
import Title from '@/components/ChatRoomTitle.vue';
import User from '@/components/ChatRoomUser.vue';
import MessagesContainer from '@/components/ChatRoomMessagesContainer.vue';
import MessageInput from '@/components/ChatRoomMessageInput.vue';
import TheAlert from '@/components/TheAlert.vue';

export default {
  name: 'ChatRoom',

  components: {
    Title,
    User,
    MessagesContainer,
    MessageInput,
    TheAlert,
  },

  mixins: [
    dateFormatMixin,
    copyTextMixin,
  ],

  computed: {
    ...mapState('user', ['user']),
    ...mapState('chatRoom', ['title', 'isPrivate', 'users', 'messages']),
    ...mapGetters('chatRoom', ['sortedUsers']),

    inviteLink() {
      return window.location.host + window.location.pathname;
    },
  },

  watch: {
    $route: 'fetchRoomData',
  },

  created() {
    this.fetchRoomData();
  },

  methods: {
    fetchRoomData() {
      const userId = this.user ? this.user.id : null;
      this.$socket.emit('view room', {
        roomId: this.$route.params.id, userId,
      }, (result) => {
        if (result.ok) {
          const { room, messages, commands } = result.payload;
          this.$store.commit('chatRoom/setChatRoom', { ...room, messages });
          this.$store.commit('user/setCommands', commands);
        } else {
          this.$store.dispatch(result.ok, { msg: result.error.msg });
        }
      });
    },

    share() {
      const copied = this.copyText(this.inviteLink);
      if (copied) {
        this.$store.dispatch('alert/ok', { msg: 'share link copied to clipboard.' });
      } else {
        this.$store.dispatch('alert/fail', { msg: 'some error occured.' });
      }
    },

    leaveRoom() {
      this.$socket.emit('leave room', {
        roomId: this.$route.params.id, userId: this.user.id,
      }, (result) => {
        if (result.ok) {
          this.$router.push({ name: 'chatRoomList' });
        } else {
          this.$store.dispatch('alert/fail', { msg: result.error.msg });
        }
      });
    },
  },

  sockets: {
    'new message'(msg) {
      this.$store.commit('chatRoom/addMessage', msg);
    },

    'user activity status'({ userId, status }) {
      this.$store.commit('chatRoom/setUserActivityStatus', [userId, status]);
    },

    'user enters'(user) {
      this.$store.commit('chatRoom/addUser', user);
    },

    'user leaves'(userId) {
      this.$store.commit('chatRoom/removeUser', userId);
    },

    'new role'(data) {
      this.$store.commit('chatRoom/setUserRole', data);
    },
  },
};
</script>
