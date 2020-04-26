<template>
  <div
    id="app"
    :class="$style.app"
  >
    <TheHeader />
    <TheMain :class="$style.main" />
    <!-- <TheFooter /> -->
  </div>
</template>

<style lang="scss" module>
.app {
  @extend %flex-defaults;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  height: 100%;
  max-height: 100%;
  background-color: $dark;
  background-image: url("./assets/img/hexagons.svg");
}

.main {
  height: 100%;
  position: relative;
}
</style>

<script>
import TheHeader from '@/components/TheHeader.vue';
import TheMain from '@/components/TheMain.vue';
// import TheFooter from '@/components/TheFooter.vue';

export default {
  name: 'App',
  components: {
    TheHeader,
    TheMain,
    // TheFooter,
  },

  mounted() {
    this.$store.dispatch('user/countdownBan');
  },
};
</script>
