<template>
  <div>
    <Autocomplete />

    <form
      :class="$style.form"
      @submit.prevent="sendMessage"
    >
      <div :class="$style.inputContainer">
        <progress
          :class="{
            [$style.progress]: true,
            [$style.progressFullfied]: charsNumber >= $options.MAX_MESSAGE_LENGTH,
          }"
          :max="$options.MAX_MESSAGE_LENGTH"
          :value="charsNumber"
        />

        <input
          ref="msgInput"
          v-model="msg"
          :class="$style.input"
          type="text"
          name="msgInput"
          autocomplete="off"
          :maxlength="$options.MAX_MESSAGE_LENGTH"
          :placeholder="placeholder"
          :disabled="disabled"
        >

        <button
          v-if="user"
          type="button"
          :class="$style.clearMessageButton"
          :disabled="charsNumber === 0"
          @click="clearMessage"
        >
          &times;
        </button>
      </div>

      <button
        type="submit"
        :disabled="disabled || !msg"
        :class="$style.sendButton"
      >
        send>
      </button>
    </form>
  </div>
</template>

<style lang="scss" module>
.form {
  @extend %flex-defaults;
  height: 100%;

  &:focus, & *:focus {
    outline: none !important;
  }
}

.inputContainer {
  position: relative;
  width: 100% - $room-users-column-width;
  height: inherit;
}

.progress {
  appearance: none;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  width: 100%;

  &::-webkit-progress-value {
    background: $yellow;
  }

  &::-webkit-progress-bar {
    background: $lightgrey;
  }

  &Fullfied::-webkit-progress-value {
    background: $red;
  }
}

$message-input-left-padding: 15px;
$clear-button-width: 15px;
$clear-button-right-margin: 10px;

$message-input-right-padding:
  $message-input-left-padding
  + $clear-button-width
  + $clear-button-right-margin;

.input {
  @extend %input;
  width: 100%;
  height: inherit;
  border: 0 none;
  border-bottom-left-radius: 5px;
  outline: none;
  padding: 0.4rem $message-input-right-padding 0.4rem $message-input-left-padding;
  line-height: 1.6;
}

.clearMessageButton {
  position: absolute;
  top: 50%;
  right: $message-input-right-padding / 2;
  transform: translate(50%, -50%);
  color: $lightgrey;

  border: none;
  padding: 0;
  background: transparent;
  font-size: 2rem;
  cursor: pointer;

  &:not(:disabled):hover {
    color: $red;
  }
}

.sendButton {
  @extend %button;
  flex-grow: 1;
  width: $room-users-column-width;
  height: 100%;
  margin: 0;
  box-shadow: none;
  border-radius: 0;
  border-bottom-right-radius: $view-border-radius;
  font-size: 1.2rem;
  background: $yellow;

  &:disabled {
    background: $lightgrey;
  }
}
</style>

<script>
import debounce from 'lodash/debounce';
import { mapState, mapGetters } from 'vuex';
import { createMessage, CommandMessage } from '@/modules/message';
import { PERMANENT_BAN } from '@/store/modules/user';
import Mention from '@/modules/mention';
import Autocomplete from './ChatRoomMessageInputAutocomplete.vue';

export default {
  name: 'ChatRoomMessageInput',

  components: {
    Autocomplete,
  },

  props: {
    roomId: {
      type: String,
      required: true,
    },
  },

  MAX_MESSAGE_LENGTH: process.env.VUE_APP_MAX_MESSAGE_LENGTH,

  computed: {
    ...mapState('user', ['user', 'banLeftSeconds']),
    ...mapGetters('user', ['isBanned', 'msgInputCommands']),

    msg: {
      get() {
        return this.$store.state.chatRoom.inputMsg;
      },

      // eslint-disable-next-line func-names, prefer-arrow-callback
      set: debounce(function (value) {
        this.$store.commit('chatRoom/setInputMessage', value);
      }, 125),
    },

    charsNumber() {
      return this.msg.length;
    },

    disabled() {
      return !this.user || this.isBanned;
    },

    placeholder() {
      if (!this.user) {
        return 'register to be able to chat';
      }
      if (this.isBanned) {
        return `you are banned for ${
          this.banLeftSeconds === PERMANENT_BAN ? 'indefinite' : this.banLeftSeconds
        } more seconds.`;
      }
      return 'start to chat';
    },
  },

  methods: {
    sendMessage() {
      let msg = this.msg.trim();
      msg = createMessage(this.msg);

      if (msg instanceof CommandMessage) {
        this.sendCommand(msg);
      } else {
        msg.send(this);
      }

      this.clearMessage();
    },

    clearMessage() {
      this.msg = '';
    },

    sendCommand(commandMsg) {
      const vm = this;
      const commandNames = this.msgInputCommands.map(({ name }) => name);
      if (commandNames.includes(commandMsg.command)) {
        commandMsg.send(vm, { roomId: this.roomId }, (result) => {
          if (result.ok) {
            vm.$store.dispatch('alert/ok', { msg: result.payload.msg });
          } else {
            vm.$store.dispatch('alert/fail', { msg: result.error.msg });
          }
        });
      } else {
        const failMsg = `invalid command: "${commandMsg.command}"`;
        this.$store.dispatch('alert/fail', { msg: failMsg });
        console.warn(failMsg);
      }
    },

    pasteMention(username) {
      const mention = Mention.build(username);
      if (this.msg.includes(mention)) return;

      if (this.msg.length !== 0) {
        this.msg = `${this.msg.trim()} ${mention} `;
      } else {
        this.msg = `${mention} `;
      }
    },
  },
};
</script>
