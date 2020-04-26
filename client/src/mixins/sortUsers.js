export default {
  computed: {
    sortedUsersByOnline() {
      return this.sortUsersByOnline(this.$store.state.chatRoomModule.users);
    },
  },
  methods: {
    sortUsersByOnline(users) {
      return [...users].sort(
        (user, other) => {
          const raiseWithHigherRole = () => (user.role > other.role ? -1 : 1);
          const sameRole = user.role === other.role;
          const bothOnline = user.isOnline && other.isOnline;
          const bothOffline = !user.isOnline && !other.isOnline;
          if (bothOffline || bothOnline) {
            if (sameRole) return 0;
            return raiseWithHigherRole();
          }

          if (user.isOnline && !other.isOnline) {
            if (sameRole) return -1;
            return raiseWithHigherRole();
          }

          if (sameRole) return 1;
          return raiseWithHigherRole();
        },
      );
    },
  },
};
