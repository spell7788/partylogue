<template>
  <a :class="$style.activator">
    sign in

    <div :class="$style.dropdown">
      <form
        :class="$style.form"
        @submit.prevent="signIn"
      >
        <div :class="$style.formField">
          <input
            v-model="username"
            :class="$style.formInput"
            type="text"
            name="username"
            placeholder="username"
            autocomplete="username"
          >
        </div>

        <div :class="$style.formField">
          <input
            v-model="password"
            :class="$style.formInput"
            type="password"
            name="password"
            placeholder="password"
            autocomplete="current-password"
          >
        </div>

        <button
          type="submit"
          :class="$style.formSubmit"
        >
          sign in
        </button>
      </form>
    </div>
  </a>
</template>

<style lang="scss" module>
.activator {
  position: relative !important;
  cursor: pointer;
  padding: .5rem 1rem;

  &:hover > .dropdown {
    display: block;
  }
}

$sign-in-dropdown-width: 200px;
.dropdown {
  display: none;
  position: absolute;
  cursor: default;
  width: $sign-in-dropdown-width;
  right: 0;
  z-index: 1;
  padding: .5rem .7rem;
  border-radius: 5px;
  box-shadow: 1px 2px 2px darken($light, 15%);
  background: $light;
  font-size: 1.15rem;
}

.form {
  text-align: center;

  &Field {
    padding-bottom: .5rem;
  }

  &Input {
    @extend %input;
    width: 100%;
    border: 1px solid $lightgrey;
    background: white;
  }

  &Submit {
    @extend %button;
    background: $green;
    color: $light;
  }
}
</style>

<script>
export default {
  name: 'UserSignIn',

  data() {
    return {
      username: null,
      password: null,
      errors: [],
    };
  },

  methods: {
    signIn() {
      // TODO: errors
      const errors = [];
      if (!this.username) errors.push('You need provide a username.');
      if (!this.password) errors.push('You need to provide a password.');

      if (!errors.length) {
        this.$socket.emit('sign in', {
          username: this.username, password: this.password,
        }, async (result) => {
          if (result.ok) {
            const { token } = result.payload;
            this.$socket.io.opts.query.token = token;
            this.$store.dispatch('user/signIn', result.payload);
          } else {
            this.$store.dispatch('alert/fail', { msg: result.error.msg });
          }
        });
      } else {
        this.errors = errors;
      }
    },
  },
};
</script>
