<template>
  <div :class="$style.entrance">
    <SignIn :class="$style.link" />

    <RouterLink
      :to="{ name: 'register' }"
      tag="a"
      :class="$style.link"
    >
      register
    </RouterLink>
  </div>
</template>

<style lang="scss" module>
.entrance {
  @extend %flex-defaults;
}

.link {
  display: block;
  cursor: pointer;
  padding: .5rem 1rem;
  font-size: 1.2rem;
  font-weight: bold;
  text-decoration: none;
  color: $light;

  &:hover {
    color: $yellow;
  }
}
</style>

<script>
import SignIn from './UserSignIn.vue';

export default {
  name: 'UserEntrance',

  components: {
    SignIn,
  },
};
</script>
