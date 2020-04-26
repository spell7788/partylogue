<template>
  <div :class="$style.placeholder">
    <span :class="$style.title">
      (ಥ _ ಥ) ~ no chat rooms yet ~
    </span>

    <RouterLink
      v-if="user"
      :to="{ name: 'createChatRoom' }"
      tag="a"
      :class="$style.createRoomButton"
    >
      create one
    </RouterLink>
  </div>
</template>

<style lang="scss" module>
.placeholder {
  @extend %flex-defaults;
  flex-direction: column;
  height: 100%;
}

.title {
  font-size: 1.4rem;
  font-weight: bold;
  text-align: center;
  margin: 0 .5rem 1rem .5rem;
}

.createRoomButton {
  @extend %button;
  background: $green;
  color: $light;
}
</style>

<script>
import { mapState } from 'vuex';

export default {
  name: 'NoRoomsPlaceholder',

  computed: {
    ...mapState('user', ['user']),
  },
};
</script>
