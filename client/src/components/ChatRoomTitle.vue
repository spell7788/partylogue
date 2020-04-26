<template>
  <div :class="$style.title">
    <input
      :value="title"
      :readonly="!isStaff"
      :title="title"
      :class="$style.input"
      type="text"
      name="title"
      placeholder="untitled"
      autocomplete="off"
      @change="changeRoomTitle"
    >
  </div>
</template>

<style lang="scss" module>
.title {
  width: 100%;
}

.input {
  @extend %input;
  width: inherit;
  background: inherit;
  border: 0;
  outline: 0;
  font-size: 1.3rem;
  font-weight: bold;

  @include mobile {
    font-size: 1rem;
  }
}
</style>


<script>
import { mapState } from 'vuex';
import User from '@/modules/user';

export default {
  name: 'ChatRoomTitle',

  props: {
    roomId: {
      type: String,
      required: true,
    },
  },

  computed: {
    ...mapState('user', ['user']),
    ...mapState('chatRoom', ['title']),

    isStaff() {
      if (!this.user) return false;
      return new User(this.user).isStaff(this.roomId);
    },
  },

  methods: {
    changeRoomTitle({ target: { value } }) {
      const title = value.trim();
      if (!title || title === this.title) return;

      const vm = this;
      this.$socket.emit('update room', {
        roomId: this.roomId,
        update: { type: 'title', payload: title },
      }, (result) => {
        if (!result.ok) {
          vm.$store.dispatch('alert/fail', { msg: result.error.msg });
        }
      });
    },
  },

  sockets: {
    'room update'(update) {
      if (!update.type === 'title') return;
      this.$store.commit('chatRoom/updateTitle', update.payload);
      this.$store.dispatch('alert/ok', {
        msg: `title has been updated to "${update.payload}"`,
      });
    },
  },
};
</script>
