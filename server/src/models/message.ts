import mongoose from "mongoose";
import * as config from "../config";
import { ModelMiddlewareError, ModelValidationError } from "../errors";
import logger from "../logger";
import ChatRoom, { IChatRoom } from "./chatRoom";
import User, { IUser } from "./user";

type ObjectId = mongoose.Types.ObjectId;

export interface IMessage extends mongoose.Document {
  room: ObjectId | IChatRoom;
  sender: ObjectId | IUser;
  date: Date;
  text: string;
}

export const MessageSchema = new mongoose.Schema<IMessage>({
  room: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "ChatRoom",
    required: true,
    validate: {
      validator: async (roomId: ObjectId): Promise<boolean> => {
        if (!(await ChatRoom.exists({ _id: roomId }))) {
          throw new ModelValidationError(`nonexistent chat room id: "${roomId}"`);
        }
        return true;
      },
    },
  },

  sender: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
    required: true,
    validate: {
      validator: async (senderId: ObjectId): Promise<boolean> => {
        if (!(await User.exists({ _id: senderId }))) {
          throw new ModelValidationError(`nonexistent sender id: "${senderId}"`);
        }
        return true;
      },
    },
  },

  date: {
    type: Date,
    default() {
      return new Date();
    },
  },

  text: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 280,
    trim: true,
  },
}, {
  toJSON: { virtuals: true, versionKey: false },
});

MessageSchema.post("save", async function(this: IMessage, _, next) {
  const model = this.constructor as mongoose.Model<IMessage>;
  const roomMessagesCount = await model.countDocuments({ room: this.room });
  if (roomMessagesCount <= config.MAX_MESSAGES_PER_CHAT_ROOM) {
    return;
  }

  const removedMessage = await model.findOneAndDelete({ room: this.room }).sort("date");
  if (!removedMessage) {
    throw new ModelMiddlewareError("old message was not removed.");
  }
  logger.debug(
    { removedMessage },
    "chat room messages number exceeds maximum. the old message has been removed.",
  );
  next();
});

export const Message = mongoose.model<IMessage>("Message", MessageSchema);
export default Message;
