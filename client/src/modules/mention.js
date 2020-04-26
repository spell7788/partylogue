const MENTION_SYMBOL = process.env.VUE_APP_MENTION_SYMBOL;

export default {
  regex: new RegExp(`${MENTION_SYMBOL}\\w+`, 'g'),

  build(username) {
    return MENTION_SYMBOL + username;
  },
};
