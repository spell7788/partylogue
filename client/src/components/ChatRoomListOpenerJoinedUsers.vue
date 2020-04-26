<template>
  <ul :class="$style.users">
    <li
      v-for="(username, i) in usernames"
      :key="i"
      :class="$style.item"
    >
      <span
        :class="{
          [$style.username]: true,
          [$style.isHostUsername]: i === 0 ? true: false,
        }"
      >{{ username }}</span>
    </li>

    <li>
      ...
    </li>
  </ul>
</template>

<style lang="scss" module>
.users {
  @include unordered-list($inline: true);
}

.item {
  margin-right: .5rem;

  &:last-child {
    margin-right: 0;

    & > .username {
      &::after {
        content: none;
      }
    }
  }
}

.username {
  &::after {
    content: ",";
  }
}

.isHostUsername {
  font-weight: bold;
}
</style>

<script>
export default {
  name: 'OpenerJoinedUsers',

  props: {
    users: {
      type: Array,
      required: true,
    },
  },

  computed: {
    usernames() {
      return this.users.map(user => user.username);
    },
  },
};
</script>
