<template>
  <div :class="$style.container">
    <h1 :class="$style.header">
      - create chat room -
    </h1>

    <form
      :class="$style.form"
      @submit.prevent="createChatRoom"
    >
      <label
        :class="$style.label"
        for="title"
      >~ title</label>
      <div :class="$style.field">
        <input
          id="title"
          v-model.trim.lazy="title"
          type="text"
          name="title"
          autocomplete="off"
          :class="$style.titleInput"
        >
      </div>

      <label
        for="isPrivate"
        :class="$style.label"
      >~ private</label>
      <div :class="$style.field">
        <input
          id="isPrivate"
          v-model="isPrivate"
          type="checkbox"
          name="isPrivate"
          :class="$style.isPrivateCheckbox"
        >
      </div>

      <div :class="$style.field">
        <button
          type="submit"
          :class="$style.submit"
        >
          ~ create ~
        </button>
      </div>
    </form>

    <TheAlert :class="$style.alert" />
  </div>
</template>

<style lang="scss" module>
.container {
  @extend %flex-defaults;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.header {
  @extend %header;
}

.form {
  @extend %form-grid;
}

.titleInput {
  @extend %input;
}

.isPrivateCheckbox {
  zoom: 1.5;
}

.submit {
  @extend %button, %buttonBig;
  background: $green;
  color: $light;
}

.alert {
  position: absolute;
  top: 15px;
  left: 20px;
  right: 20px;
}
</style>

<script>
import { mapState } from 'vuex';
import TheAlert from '@/components/TheAlert.vue';

export default {
  name: 'CreateChatRoom',

  components: {
    TheAlert,
  },

  data() {
    return {
      title: null,
      isPrivate: false,
    };
  },

  computed: {
    ...mapState('user', ['user']),
  },

  methods: {
    createChatRoom() {
      if (!this.title) {
        this.$store.dispatch('alert/fail', { msg: 'you have to provide the room title' });
        return;
      }

      const roomData = {
        host: this.user.id,
        title: this.title,
        isPrivate: this.isPrivate,
      };

      this.$socket.emit('create room', roomData, (result) => {
        if (result.ok) {
          const { payload: room } = result;
          this.$store.dispatch('alert/ok', {
            msg: `"${room.title}" room has been created.`,
          });
          this.$router.push({ name: 'chatRoom', params: { id: result.payload.id } });
        } else {
          this.$store.dispatch('alert/fail', { msg: result.error.msg });
        }
      });
    },
  },
};
</script>
