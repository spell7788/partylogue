<template>
  <div :class="$style.container">
    <div
      v-if="chatRooms.length > 0 && !isLoading"
      :class="$style.panels"
    >
      <div
        ref="openers"
        :class="$style.openers"
      >
        <RoomOpener
          v-for="room in chatRooms"
          :key="room.id"
          :room="room"
          :class="$style.opener"
        />
      </div>

      <div
        v-if="hasNextPage"
        :class="$style.pagination"
      >
        <button
          :class="$style.moreButton"
          @click="fetchChatRooms(++pageNumber)"
        >
          ~ more ~
        </button>
      </div>
    </div>
    <div v-else-if="chatRooms.length === 0 && isLoading" />
    <NoRoomsPlaceholder v-else />

    <TheAlert :class="$style.alert" />
  </div>
</template>

<style lang="scss" module>
.container {
  height: 100%;
  position: relative;
}

$panels-padding: 10px;
.panels {
  @extend %flex-defaults;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  width: 100%;
  padding: $panels-padding;
  position: relative;

  @include mobile {
    padding: 0;
  }
}

%panel {
  width: 100%;
  // margin: 5px 0;
  box-shadow: 0 0 15px 2px $lightgrey;

  &:not(:last-child):not([display="none"]) {
    margin-bottom: 10px;
  }
}

.openers {
  @extend %panel;
  // height: 100%;
  // width: 100%;
  overflow-y: scroll;
  // box-shadow: 0 0 15px 2px $lightgrey;

  // @include mobile {
  //   box-shadow: none;
  // }
}

.opener {
  &:nth-child(odd) {
    background: $darker-light;
  }
}

.pagination {
  @extend %panel;
  @extend %flex-defaults;
  padding: 10px;
}

.moreButton {
  @extend %button;
  background: $yellow;
  // margin-top: $room-list-padding;
  // position: absolute;
  // height: $more-button-height;
  // bottom: - ($more-button-height / 2);
  // left: 50%;
  // transform: translateX(-50%);
}

.alert {
  position: absolute;
  top: 10px;
  left: 20px;
  right: 20px;
}
</style>

<script>
import { mapState } from 'vuex';
import RoomOpener from '@/components/ChatRoomListOpener.vue';
import NoRoomsPlaceholder from '@/components/ChatRoomListNoRoomsPlaceholder.vue';
import TheAlert from '@/components/TheAlert.vue';

export default {
  name: 'ChatRoomList',

  components: {
    RoomOpener,
    NoRoomsPlaceholder,
    TheAlert,
  },

  data() {
    return {
      chatRooms: [],
      pageNumber: 1,
      hasNextPage: false,
      isLoading: true,
    };
  },

  computed: {
    ...mapState('user', ['user']),
  },

  watch: {
    user() {
      this.chatRooms = [];
      this.pageNumber = 1;
      this.fetchChatRooms(this.pageNumber);
    },

    chatRooms() {
      if (this.pageNumber === 1) return;
      this.$nextTick(() => {
        const { openers } = this.$refs;
        const latestOpener = openers && openers.lastChild;
        if (!latestOpener) return;
        latestOpener.scrollIntoView();
      });
    },
  },

  created() {
    this.fetchChatRooms(this.pageNumber);
  },

  methods: {
    fetchChatRooms(pageNumber) {
      this.isLoading = true;

      const payload = { pageNumber };
      if (this.user) payload.userId = this.user.id;

      this.$socket.emit('view room list', payload, (result) => {
        this.isLoading = false;

        if (!result.ok) {
          this.$store.dispatch('alert/fail', { msg: result.error.msg });
          return;
        }

        const { docs: rooms } = result.payload;
        this.hasNextPage = result.payload.hasNextPage;

        if (!rooms.length) return;

        const addedRoomsIds = this.chatRooms.map(room => room.id);
        rooms.forEach((room) => {
          if (addedRoomsIds.includes(room.id)) return;
          this.chatRooms.push(room);
        });
      });
    },
  },

  sockets: {
    'new room'(room) {
      this.chatRooms.push(room);
    },

    'removed room'(roomId) {
      const i = this.chatRooms.findIndex(room => room.id === roomId);
      this.chatRooms.splice(i, 1);
    },
  },
};
</script>
