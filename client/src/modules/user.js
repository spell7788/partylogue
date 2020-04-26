import { USER_ROLE } from '@/consts';
import Mention from './mention';

export default class User {
  // eslint-disable-next-line object-curly-newline
  constructor({ id, email, username, roles }) {
    this.id = id;
    this.email = email;
    this.username = username;
    this.roles = roles;
  }

  compareDominantRoles(otherUser, roomId = null) {
    const userRole = this.getDominantRole(roomId);
    const otherRole = otherUser.getDominantRole(roomId);
    if (userRole === otherRole) return 0;
    return userRole > otherRole ? -1 : 1;
  }

  getDominantRole(roomId = null) {
    if (!roomId) return this.globalRole;
    const localRole = this.getLocalRole(roomId);
    if (localRole === USER_ROLE.HOST) return localRole;
    return Math.max(localRole, this.globalRole);
  }

  getLocalRole(roomId) {
    return this.roles.roles[roomId] || USER_ROLE.USER;
  }

  isStaff(roomId = null) {
    return this.isGlobalStaff || this.isLocalStaff(roomId);
  }

  isLocalStaff(roomId = null) {
    return this.getDominantRole(roomId) > USER_ROLE.USER;
  }

  get isGlobalStaff() {
    return this.globalRole > USER_ROLE.USER;
  }

  get globalRole() {
    return this.roles.global;
  }

  // eslint-disable-next-line class-methods-use-this
  get globalRoleName() {
    return 'user';
  }

  get mentionString() {
    return Mention.build(this.username);
  }
}
