<template>
  <div :class="$style.roomUser">
    <div :class="$style.info">
      <img
        v-if="roleBadge"
        :src="roleBadge"
        :class="$style.badge"
      >

      <a
        :class="{ [$style.usernameLink]: !!loggedInUser }"
        :title="user.username"
        v-on="{ [loggedInUser ? 'click' : null]: pasteMention }"
      >
        {{ truncatedUsername }}
      </a>
    </div>

    <ActivityIndicator
      :user="user"
      :class="$style.indicator"
    />
  </div>
</template>

<style lang="scss" module>
.roomUser {
  @extend %flex-defaults;
  justify-content: space-between;
  padding: .8rem 1rem;
  border-bottom: 2px solid $lightgrey;

  @include mobile {
    padding: .5rem .3rem;
  }
}

.info {
  @extend %flex-defaults;

  @include children-gap(.5rem) {
    @include mobile {
      margin-right: .3rem;
    }
  }
}

.usernameLink {
  @extend %link;
}

.badge {
  width: 18px;
  height: auto;

  @include mobile {
    width: 14px;
  }
}

.indicator {
  @include mobile {
    margin-right: .3rem;
  }
}
</style>

<script>
import { mapState } from 'vuex';
import { truncateCharsIfLonger } from '@/utils';
import { roleBadgeMixin } from '@/mixins';
import User from '@/modules/user';
import Mention from '@/modules/mention';
import ActivityIndicator from './UserActivityIndicator.vue';

export default {
  name: 'ChatRoomUser',

  components: {
    ActivityIndicator,
  },

  mixins: [
    roleBadgeMixin,
  ],

  props: {
    roomId: {
      type: String,
      required: true,
    },

    userId: {
      type: String,
      required: true,
    },
  },

  computed: {
    ...mapState('user', { loggedInUser: 'user' }),

    user() {
      const getter = this.$store.getters['chatRoom/getUser'];
      return getter(this.userId);
    },

    truncatedUsername() {
      return truncateCharsIfLonger(this.user.username, 5, '~');
    },

    badgeRole() {
      return new User(this.user).getDominantRole(this.roomId);
    },
  },

  methods: {
    pasteMention() {
      if (!this.loggedInUser) return;
      const mention = Mention.build(this.user.username);
      this.$store.dispatch('chatRoom/appendToMessage', `${mention} `);
    },
  },
};
</script>
