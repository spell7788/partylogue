<template>
  <header :class="$style.header">
    <div :class="$style.logo">
      <RouterLink
        :to="{ name: 'chatRoomList' }"
        tag="a"
        :class="$style.logoLink"
      >
        {{ logoText }}
      </RouterLink>
    </div>

    <Component
      :is="userOrEntrance"
      :class="$style.entrance"
    />
  </header>
</template>

<style lang="scss" module>
.header {
  @extend %flex-defaults;
  justify-content: space-between;
  padding: 0 5%;
  background: $dark;
  color: $light;

  @include mobile {
    padding: 0 10px;
  }
}

.logo {
  padding: 0.5rem 1rem;
}

.logoLink {
  color: $yellow;
  font-size: 3rem;
  font-weight: bold;
  text-decoration: none;

  @include mobile {
    font-size: 1.8rem;
  }

  &:hover, &:focus {
    color: $lightpink;
  }

  &:active {
    color: $yellow;
  }
}
</style>

<script>
import { mapState } from 'vuex';
import UserArea from '@/components/UserArea.vue';
import UserEntrance from '@/components/UserEntrance.vue';

export default {
  name: 'TheHeader',

  data() {
    return {
      logoText: process.env.VUE_APP_LOGO_TEXT,
    };
  },

  computed: {
    ...mapState('user', ['user']),

    userOrEntrance() {
      return this.user ? UserArea : UserEntrance;
    },
  },
};
</script>
