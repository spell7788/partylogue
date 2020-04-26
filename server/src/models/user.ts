import mongoose from "mongoose";
import { AuthUserRegistry } from "../services";
import { GlobalRole, IRoles, LocalRole, RolesSchema } from "./userRoles";

export enum ActivityStatusValue { DISCONNECTED, INACTIVE, ACTIVE }

export interface IUser extends mongoose.Document, Pick<IRoles, "getDominantRole"> {
  username: string;
  passwordHash: string;
  email: string;
  roles: IRoles;
  activityStatus: ActivityStatusValue;
  active: () => boolean;
  inactive: () => boolean;
}

export const UserSchema = new mongoose.Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 12,
  },

  passwordHash: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: /^\w+\@\w+\.[\w\.]+$/,
      msg: "Invalid email.",
    },
  },

  roles: {
    type: RolesSchema,
    default() {
      return {};
    },
  },
}, {
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform(_: IUser, ret: IUser): Omit<IUser, "passwordHash"> {
      delete ret.passwordHash;
      return ret;
    },
  },
});

UserSchema.virtual("activityStatus").get(function(this: IUser): ActivityStatusValue {
  const registry = AuthUserRegistry.getInstance();
  const registryValue = registry.get(this.id);
  if (!registryValue) { return ActivityStatusValue.DISCONNECTED; }
  if (registryValue.activityStatus.isActive) {
    return ActivityStatusValue.ACTIVE;
  } else {
    return ActivityStatusValue.INACTIVE;
  }
});

UserSchema.methods.getDominantRole = function(
  this: IUser, roomId?: string,
): GlobalRole | LocalRole {
  return this.roles.getDominantRole(roomId);
};

UserSchema.methods.active = function(this: IUser): boolean {
  const registry = AuthUserRegistry.getInstance();
  const registryValue = registry.get(this.id);
  if (!registryValue) {
    return false;
  }

  const { socket, activityStatus } = registryValue;
  if (activityStatus.isActive) { return false; }
  activityStatus.setActive((inactiveUserId) => {
    socket.server.sockets.emit("user activity status", {
      userId: inactiveUserId,
      status: ActivityStatusValue.INACTIVE,
    });
  });
  socket.server.sockets.emit("user activity status", {
    userId: this.id,
    status: ActivityStatusValue.ACTIVE,
  });
  return true;
};

UserSchema.methods.inactive = function(this: IUser): boolean {
  const registry = AuthUserRegistry.getInstance();
  const registryValue = registry.get(this.id);
  if (!registryValue) {
    return false;
  }

  const { socket, activityStatus } = registryValue;
  if (!activityStatus.isActive) { return false; }
  activityStatus.setInactive();
  socket.server.sockets.emit("user activity status", {
    userId: this.id,
    status: ActivityStatusValue.INACTIVE,
  });
  return true;
};

export const User = mongoose.model<IUser>("User", UserSchema);
export default User;
