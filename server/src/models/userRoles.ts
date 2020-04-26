import mongoose from "mongoose";

export const enum Role {
  USER, MOD, HOST, GLOBAL_MOD, ADMIN,
}

export enum GlobalRole {
  USER = Role.USER, GLOBAL_MOD = Role.GLOBAL_MOD, ADMIN = Role.ADMIN,
}

export enum LocalRole {
  USER = Role.USER, MOD = Role.MOD, HOST = Role.HOST,
}

export interface IRoles extends mongoose.Document {
  global: GlobalRole;
  roles: mongoose.Types.Map<LocalRole>;
  getDominantRole: (roomId?: string) => GlobalRole | LocalRole;
}

export const RolesSchema = new mongoose.Schema<IRoles>({
  global: {
    type: Number,
    default: Role.USER,
  },

  roles: {
    type: Map,
    of: Number,
    default() {
      return new Map<string, LocalRole>();
    },
  },
});

RolesSchema.methods.getDominantRole = function(
this: IRoles, roomId?: string,
): GlobalRole | LocalRole {
  if (!roomId) { return this.global; }
  const localRole = this.roles.get(roomId) || LocalRole.USER;
  return Math.max(localRole, this.global);
};
