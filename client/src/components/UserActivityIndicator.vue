<template>
  <span :class="[$style.activityIndicator, activityStatusClass]" />
</template>

<style lang="scss" module>
.activityIndicator {
  @include circle(8px);
}

$colors: ("disconnected": $red, "inactive": $yellow, "active": $green);
@each $class, $color in $colors {
  .#{$class} {
    background: $color;
  }
}
</style>

<script>
import { ACTIVITY_STATUS } from '@/consts';

export default {
  name: 'UserActivityIndicator',

  props: {
    user: {
      type: Object,
      required: true,
    },
  },

  computed: {
    activityStatusClass() {
      switch (this.user.activityStatus) {
        case ACTIVITY_STATUS.DISCONNECTED:
          return this.$style.disconnected;

        case ACTIVITY_STATUS.INACTIVE:
          return this.$style.inactive;

        case ACTIVITY_STATUS.ACTIVE:
          return this.$style.active;

        default:
          throw new Error(`unknown activity status: ${this.user.activityStatus}`);
      }
    },
  },
};
</script>
