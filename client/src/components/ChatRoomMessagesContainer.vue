<template>
  <div :class="$style.container">
    <div
      ref="messages"
      :class="$style.messages"
    >
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="$style.messageContainer"
      >
        <Message
          :msg="msg"
          :room-id="$route.params.id"
          :class="$style.message"
        />
      </div>
    </div>

    <button
      v-show-if-overflowing="`.${$style.messages}`"
      :class="$style.toLatestMessageButton"
      @click="scrollToLatestMessage"
    >
      <i :class="$style.toBottomArrow" />
    </button>
  </div>
</template>

<style lang="scss" module>
.container {
  position: relative;
  height: 100%;
}

.messages {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.toBottomArrow {
  border: solid $dark;
  border-width: 0 3px 3px 0;
  display: inline-block;
  padding: 3px;
  transform: rotate(45deg);
}

$to-bottom-diameter: 40px;
$to-bottom-mobile-diameter: $to-bottom-diameter * .8;
.toLatestMessageButton {
  @include circle($to-bottom-diameter);
  position: absolute;
  right: 2rem;
  bottom: 1rem;
  background: transparent;
  color: $dark;
  border: 2px solid $dark;
  opacity: .25;
  outline: none;
  cursor: pointer;

  &:hover {
    opacity: 1;
    color: $yellow;
    border-color: $yellow;
    transition: opacity .5s;
  }

  &:hover > .toBottomArrow {
    border-color: $yellow;
  }

  @include mobile {
    @include circle($to-bottom-mobile-diameter);
  }
}

.messageContainer {
  padding: 1rem;
}

.messageContainer:nth-child(odd) {
  background: $darker-light;

  & > .message {
    background: white;
  }
}

.messageContainer:nth-child(even) {
  & > .message {
    background: $lightpink;
  }
}
</style>

<script>
import { mapState } from 'vuex';
import showIfOverflowing from '@/directives/showIfOverflowing';
import Message from './ChatRoomMessage.vue';

let scrolledToMention = false;

export default {
  name: 'ChatRoomMessagesContainer',

  directives: {
    showIfOverflowing,
  },

  components: {
    Message,
  },

  computed: {
    ...mapState('chatRoom', ['messages']),
  },

  watch: {
    messages() {
      this.$nextTick(() => {
        const { messages } = this.$refs;
        let msg;
        if (this.$route.hash && !scrolledToMention) {
          msg = messages.querySelector(this.$route.hash);
          scrolledToMention = true;
        } else {
          msg = messages.lastChild && messages.lastChild.lastChild;
        }

        if (!msg) return;
        msg.scrollIntoView();
      });
    },

    '$refs.messages'() {

    },
  },

  methods: {
    scrollToLatestMessage() {
      this.$nextTick(() => {
        const { messages } = this.$refs;
        const latestMessage = messages.lastChild && messages.lastChild.lastChild;
        if (!latestMessage) return;
        latestMessage.scrollIntoView();
      });
    },
  },
};
</script>
