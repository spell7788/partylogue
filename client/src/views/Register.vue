<template>
  <div :class="$style.container">
    <h1 :class="$style.header">
      - register -
    </h1>

    <form
      :class="$style.form"
      @submit.prevent="register"
    >
      <label
        :class="$style.label"
        for="email"
      >~ email</label>
      <div :class="$style.field">
        <input
          id="email"
          v-model="email"
          type="email"
          name="email"
          :class="$style.input"
        >
      </div>

      <label
        :class="$style.label"
        for="username"
      >~ username</label>
      <div :class="$style.field">
        <input
          id="username"
          v-model="username"
          type="text"
          name="username"
          autocomplete="username"
          :class="$style.input"
        >
      </div>

      <label
        :class="$style.label"
        for="password"
      >~ password</label>
      <div :class="$style.field">
        <input
          id="password"
          v-model="password"
          type="password"
          name="password"
          autocomplete="new-password"
          :class="$style.input"
        >
      </div>

      <label
        :class="$style.label"
        for="passwordRepeat"
      >~ repeat password</label>
      <div :class="$style.field">
        <input
          id="passwordRepeat"
          v-model="passwordRepeat"
          type="password"
          name="passwordRepeat"
          autocomplete="new-password"
          :class="$style.input"
        >
      </div>

      <div :class="$style.field">
        <button
          :class="$style.submit"
          type="submit"
        >
          ~ register ~
        </button>
      </div>
    </form>

    <TheAlert :class="$style.alert" />
  </div>
</template>

<style lang="scss" module>
.container {
  @extend %flex-defaults;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.header {
  @extend %header;
}

.form {
  @extend %form-grid;
}

.alert {
  position: absolute;
  top: 15px;
  left: 20px;
  right: 20px;
}
</style>

<script>
import TheAlert from '@/components/TheAlert.vue';

export default {
  name: 'Register',

  components: {
    TheAlert,
  },

  beforeRouteEnter(to, from, next) {
    next((vm) => {
      if (vm.$store.state.user.user) {
        vm.$router.push({ name: 'chatRoomList' });
      }
    });
  },

  data() {
    return {
      email: null,
      username: null,
      password: null,
      passwordRepeat: null,
    };
  },

  methods: {
    register() {
      const fieldsValues = Object.values(this.$data);
      if (!fieldsValues.every(v => !!v)) {
        this.$store.dispatch('alert/fail', {
          msg: 'all registration fields have to be filled',
        });
        return;
      }

      if (this.password === this.passwordRepeat) {
        const { passwordRepeat, ...registerData } = this.$data;

        this.$socket.emit('register', registerData, (result) => {
          if (result.ok) {
            this.$store.commit('user/setUser', result.payload);
            this.$router.push({ name: 'chatRoomList' });
          } else {
            this.$store.dispatch('alert/fail', { msg: result.error.msg });
          }
        });
      }
    },
  },
};
</script>
