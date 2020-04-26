<template>
  <div
    v-show="alert.type && alert.msg"
    :class="[$style.alert, typeClass]"
  >
    <Component
      :is="alertComponent.component"
      v-bind="alertComponent.props"
      :class="{
        [$style.message]: true,
        [$style.routerLink]: alertComponent.component === 'RouterLink',
      }"
    >
      <span :class="$style.icon">
        {{ alert.icon }}
      </span>

      <p :class="$style.text">
        {{ alert.msg }}
      </p>
    </Component>

    <button
      :class="$style.close"
      @click="closeAlert"
    >
      &times;
    </button>
  </div>
</template>

<style lang="scss" module>
.alert {
  @extend %flex-defaults;
  justify-content: space-between;
  align-items: stretch;
  padding: 0.5rem 1rem;
  border-radius: 5px;
}

.ok {
  background: $green;
  color: $light;
}

.fail {
  background: $red;
  color: $light;
}

.info {
  background: $lightgrey;
}

.mention {
  background: $dark;
  color: $light;
}

.message {
  @extend %flex-defaults;
  @include children-gap(.5rem);
}

.text {
  margin: auto;
  flex-grow: 1;
  word-wrap: break-word;
}

.routerLink {
  @extend %link;

  &:hover {
    text-decoration: none;
    color: lighten($blue, 8%);
  }
}

.close {
  cursor: pointer;
  border: 0;
  outline: none;
  background: transparent;
  color: $light;
  font-size: 1.5rem;

  &:hover, &:focus {
    color: $red;
  }
}
</style>

<script>
import { mapState } from 'vuex';

export default {
  name: 'TheAlert',

  computed: {
    ...mapState('alert', ['alert']),

    alertComponent() {
      const { routeTo } = this.alert;
      return routeTo && routeTo.params.id !== this.$route.params.id
        ? { component: 'RouterLink', props: { to: routeTo } }
        : { component: 'div' };
    },

    typeClass() {
      const { type } = this.alert;
      if (!type) return null;
      return this.$style[type];
    },
  },

  methods: {
    closeAlert() {
      this.$store.commit('alert/resetAlert');
    },
  },
};
</script>
