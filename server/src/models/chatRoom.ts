import mongoose, { PaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import util from "util";
import { ModelMiddlewareError, ModelValidationError } from "../errors";
import io from "../io";
import logger from "../logger";
import { IMessage } from "./message";
import User, { IUser } from "./user";
import { LocalRole } from "./userRoles";

type ObjectId = mongoose.Types.ObjectId;
export interface IChatRoom extends mongoose.Document {
  host: mongoose.Types.ObjectId | IUser;
  title: string;
  isPrivate: boolean;
  users: mongoose.Types.Array<ObjectId> | mongoose.Types.Array<IUser>;
  latestMessage: IMessage;
}

export const ChatRoomSchema = new mongoose.Schema<IChatRoom>({
  host: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },

  title: {
    type: String,
    required: true,
    trim: true,
  },

  isPrivate: {
    type: Boolean,
    default: false,
  },

  users: [
    {
      type: mongoose.Types.ObjectId,
      ref: "User",
      validate: {
        validator: async (userId: ObjectId): Promise<boolean> => {
          if (!(await User.exists({ _id: userId }))) {
            throw new ModelValidationError(`nonexistent user id: "${userId}"`);
          }
          return true;
        },
      },
    },
  ],
}, {
  toJSON: {
    virtuals: true,
    versionKey: false,
  },
});

ChatRoomSchema.plugin(mongoosePaginate);

function isPopulatedHost(host: mongoose.Types.ObjectId | IUser): host is IUser {
  return !(host instanceof mongoose.Types.ObjectId) && ("_id" in host);
}

ChatRoomSchema.pre(
  "save", async function(this: IChatRoom, next: mongoose.HookNextFunction,
) {
  if (!this.isNew) { return next(); }

  let hostUser: IUser;
  if (!isPopulatedHost(this.host)) {
    hostUser = (await User.findById(this.host))!;
  } else {
    hostUser = this.host;
  }

  hostUser.roles.roles.set(this.id, LocalRole.HOST);
  try {
    await hostUser.save();
  } catch (err) {
    throw ModelMiddlewareError.from(
      err, `can't appoint host role to the user: ${util.inspect(hostUser)}`,
    );
  }

  this.users.addToSet(hostUser.id);
  next();
});

ChatRoomSchema.post("save", async function(this: IChatRoom, _, next) {
  if (this.users.length > 0) { return next(); }

  try {
    await this.remove();
  } catch (err) {
    throw ModelMiddlewareError.from(
      err, `chat room hasn't been removed when all users leaved. Users: ${this.users}`,
    );
  }
  logger.debug({ chatRoom: this }, "chat room has been removed when all users leaved.");
});

ChatRoomSchema.pre(
  "remove", async function(this: IChatRoom, next: mongoose.HookNextFunction,
) {
  const localRoleField = `roles.roles.${this.id}`;

  let usersNumber: number | null = null;
  try {
    ({ nModified: usersNumber } = await User.updateMany(
      { [localRoleField]: { $exists: true } }, { $unset: { [localRoleField]: true } },
    ));
  } catch (err) {
    throw ModelMiddlewareError.from(err, "local roles of room users hasn't been removed.");
  }
  logger.debug("removed local roles of %d users related to the chat room.", usersNumber);
  next();
});

ChatRoomSchema.post("remove", async function(this: IChatRoom) {
  io.sockets.emit("removed room", this.id);
});

ChatRoomSchema.virtual("latestMessage", {
  ref: "Message",
  localField: "_id",
  foreignField: "room",
  justOne: true,
  options: { sort: { date: -1 }, populate: "sender" },
});

export const ChatRoom: PaginateModel<IChatRoom>
  = mongoose.model("ChatRoom", ChatRoomSchema);
export default ChatRoom;
