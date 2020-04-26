<template>
  <div
    :class="$style.opener"
    @click="gotoRoom"
  >
    <div :class="$style.info">
      <span>
        {{ room.isPrivate ? '🔒' : '🌐' }}
      </span>

      <div :class="$style.titleContainer">
        <h4
          :class="$style.title"
          :title="room.title"
        >
          {{ truncatedRoomTitle }}
        </h4>

        <JoinedUsers
          v-if="room"
          :users="room.users"
        />
      </div>

      <div
        v-if="latestMessage"
        :class="$style.latestMessage"
      >
        <strong>{{ latestMessage.sender.username }}:</strong>
        {{ truncatedLatestMessage }}
      </div>
    </div>

    <div
      v-if="userObj && userObj.isGlobalStaff"
      :class="$style.staffActions"
    >
      <button
        :class="$style.roomRemoveButton"
        @click.stop="removeRoom"
      >
        remove
      </button>
    </div>
  </div>
</template>

<style lang="scss" module>
.opener {
  @extend %flex-defaults;
  justify-content: space-between;
  padding: 1.2rem 1rem;
  cursor: pointer;

  @include mobile {
    padding: .8rem .5rem;
  }
}

.opener:hover, .opener:focus {
  background: $lightpink !important;

  & .latestMessage {
    background: $yellow;
  }
}

.info {
  @extend %flex-defaults;
  justify-content: flex-start;
  flex-grow: 1;

  @include children-gap(1rem) {
    @include mobile {
      margin-right: .4rem;
    }
  }
}

.titleContainer {
  min-width: 35%;
  width: 35%;
}

.title {
  margin: 0;
  font-size: 1.4rem;

  @include mobile {
    font-size: 1.2rem;
  }
}

.latestMessage {
  padding: .6rem 1.1rem;
  background: $lightpink;
  border-radius: 5px;
  word-break: break-all;

  @include mobile {
    padding: .4rem .6rem;
  }
}

.staffActions {
  @extend %flex-defaults;
  min-width: 20%;
}

.roomRemoveButton {
  @extend %button, %buttonSmall;
  background: $red;
  color: $light;
}
</style>

<script>
import { mapState, mapGetters } from 'vuex';
import dateFormatMixin from '@/mixins/dateFormat';
import { truncateCharsIfLonger } from '@/utils';
import JoinedUsers from './ChatRoomListOpenerJoinedUsers.vue';

export default {
  name: 'ChatRoomOpener',

  components: {
    JoinedUsers,
  },

  mixins: [
    dateFormatMixin,
  ],

  props: {
    room: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      latestMessage: null,
    };
  },

  computed: {
    ...mapState('user', ['user']),
    ...mapGetters('user', ['userObj']),

    truncatedRoomTitle() {
      return truncateCharsIfLonger(this.room.title, 10);
    },

    truncatedLatestMessage() {
      return truncateCharsIfLonger(this.latestMessage.text, 35, '...');
    },
  },

  created() {
    this.latestMessage = this.room.latestMessage;
  },

  methods: {
    gotoRoom() {
      this.$router.push({ name: 'chatRoom', params: { id: this.room.id } });
    },

    removeRoom() {
      this.$socket.emit('remove room', { roomId: this.room.id }, (result) => {
        if (result.ok) {
          this.$store.dispatch('alert/ok', { msg: result.payload.msg });
        } else {
          this.$store.dispatch('alert/fail', { msg: result.error.msg });
        }
      });
    },
  },
};
</script>
