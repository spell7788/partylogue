export default {
  methods: {
    formatDate(isoDate) {
      return new Date(isoDate).toLocaleTimeString();
    },
  },
};
