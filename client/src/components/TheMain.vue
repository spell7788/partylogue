<template>
  <main>
    <div :class="$style.view">
      <KeepAlive
        include="ChatRoomList"
        max="1"
      >
        <RouterView />
      </KeepAlive>
    </div>
  </main>
</template>

<style lang="scss" module>
.view {
  position: absolute;
  top: 10px;
  bottom: $more-button-height;
  left: 5%;
  right: 5%;
  height: auto;
  background: $light;
  color: $dark;
  border-radius: $view-border-radius;

  @include mobile {
    border-radius: 0;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }
}
</style>

<script>
export default {
  name: 'TheMain',
};
</script>
