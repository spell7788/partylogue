<template>
  <div :class="$style.container">
    <div>
      <button
        v-if="!msgRemoved"
        :class="$style.removeMessageButton"
        @click="removeMessage"
      >
        remove
      </button>
    </div>
  </div>
</template>

<style lang="scss" module>
.container {
  @extend %flex-defaults;
  padding: 0.5rem 0;
}

.removeMessageButton {
  @extend %button;
}
</style>

<script>
import { mapState } from 'vuex';
import { commandSendBehavior } from '@/modules/message';

export default {
  name: 'ChatRoomMessageActions',

  props: {
    msg: {
      type: Object,
      required: true,
    },

    msgRemoved: {
      type: Boolean,
      required: true,
    },

    isStaff: {
      type: Boolean,
      required: true,
    },
  },

  computed: {
    ...mapState('user', ['user']),
    ...mapState('chatRoom', { roomId: 'id' }),

    noAvailableActions() {
      return this.msgRemoved && this.isStaff;
    },
  },

  watch: {
    noAvailableActions(value) {
      if (value) {
        this.$emit('noAvailableActions');
      }
    },
  },

  methods: {
    removeMessage() {
      const commandSendObj = Object.create(commandSendBehavior, {
        command: { value: 'remove' },
      });
      const vm = this;
      commandSendObj.send(vm, {
        targetId: this.msg.sender.id,
        msgId: this.msg.id,
        roomId: this.roomId,
      }, (result) => {
        if (result.ok) {
          vm.$parent.$emit('removeMessage', vm.msg.id);
        } else {
          this.$store.dispatch('alert/fail', { msg: result.error.msg });
        }
      });

      this.$emit('toggle-actions-visibility');
    },
  },
};
</script>
