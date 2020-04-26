import { USER_ROLE } from '../consts';

const badges = require.context('@/assets/img/badges', false, /\.png$/);

const roleBadgePathMap = {
  [USER_ROLE.USER]: './user.png',
  [USER_ROLE.MOD]: './mod.png',
  [USER_ROLE.HOST]: './host.png',
  [USER_ROLE.GLOBAL_MOD]: './gmod.png',
  [USER_ROLE.ADMIN]: './admin.png',
};

export default {
  computed: {
    roleBadge() {
      const badgePath = roleBadgePathMap[this.badgeRole];
      if (!badgePath) throw new Error(`invalid user role value: ${this.badgeRole}`);
      return badges(badgePath);
    },
  },
};
