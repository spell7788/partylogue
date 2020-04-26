import mongoose from "mongoose";
import * as config from "../config";
import { InternalHandlerError } from "../errors";
import logger from "../logger";
import { IChatRoom, IUser, Message, Role } from "../models";
import { ChatRoom } from "../models";
import BaseHandler, { RequireUserRole, UpdatesActivity } from "./base";
import { commands, ICommandMeta } from "./command";

interface IViewChatRoomListData {
  pageNumber: number;
}

@UpdatesActivity
export class ViewChatRoomListHandler extends BaseHandler<IViewChatRoomListData> {
  protected async executeImpl({ pageNumber }: IViewChatRoomListData) {
    const page = pageNumber > 0 ? pageNumber : 1;
    const options: mongoose.PaginateOptions = {
      page,
      limit: config.CHAT_ROOM_LIST_LIMIT,
      populate: [
        {
          path: "users",
          select: "username",
          options: { limit: config.JOINED_USERS_DISPLAY_LIMIT },
        },
        {
          path: "latestMessage",
        },
      ],
    };

    let rooms: mongoose.PaginateResult<IChatRoom>;
    if (this.user) {
      rooms = await ChatRoom.paginate({
        $or: [{ isPrivate: false }, { users: { $eq: this.user.id } }],
      }, { sort: "-isPrivate", ...options });
    } else {
      rooms = await ChatRoom.paginate({ isPrivate: false }, options);
    }

    this.ok(rooms);
  }
}

interface ICreateChatRoomData {
  host: string;
  title?: string;
  isPrivate: boolean;
}

@RequireUserRole()
@UpdatesActivity
export class CreateChatRoomHandler extends BaseHandler<ICreateChatRoomData> {
  protected async executeImpl(createData: ICreateChatRoomData) {
    let room = await ChatRoom.create(createData);
    logger.debug({ chatRoom: room }, "chat room has been created");

    room = await room.populate("users").execPopulate();
    this.socket.server.sockets.emit("new room", room);
    this.ok(room);
  }
}

interface IRemoveChatRoomData {
  roomId: string;
}

@RequireUserRole(Role.GLOBAL_MOD)
@UpdatesActivity
export class RemoveChatRoomHandler extends BaseHandler<IRemoveChatRoomData> {
  public minRequiredRole = Role.GLOBAL_MOD;

  protected async executeImpl({ roomId }: IRemoveChatRoomData) {
    const room = await this.getObject("ChatRoom", roomId);
    await room.remove();
    this.ok('"%s" room has been removed', room.title);
    // "removed room" event emits in post remove hook automatically
  }
}

interface IViewChatRoomData {
  roomId: string;
}

@UpdatesActivity
export class ViewChatRoomHandler extends BaseHandler<IViewChatRoomData> {
  protected async executeImpl({ roomId }: IViewChatRoomData) {
    let room = await this.getObject("ChatRoom", roomId);
    if (!this.user && room.isPrivate) {
      this.fail("anonymous users cannot view private rooms");
    }

    let userCommands: ICommandMeta[] = [];
    if (this.user) {
      const userRef = (room.users as mongoose.Types.Array<mongoose.Types.ObjectId>)
        .find((id) => id.equals(this.user!.id));

      if (!userRef) {
        room.users.addToSet(this.user!.id);
        room = await room.save();
        this.socket.to(room.id).emit("user enters", this.user!.id);
      }

      userCommands = this.getUserCommands(this.user, roomId);
    }

    room = await room.populate("users").execPopulate();
    const messages = await Message.find({ room: room.id }).populate("sender");
    this.socket.join(room.id);
    this.ok({ room, messages, commands: userCommands });
  }

  protected getUserCommands(user: IUser, roomId: string): ICommandMeta[] {
    const userCommands: ICommandMeta[] = [];
    for (const handler of Object.values(commands)) {
      if (handler.META.minRequiredRole > user.getDominantRole(roomId)) {
        continue;
      }
      userCommands.push(handler.META);
    }

    if (userCommands.length === 0) { return []; }
    return userCommands;
  }
}

interface ILeaveChatRoomData {
  roomId: string;
}

@RequireUserRole()
export class LeaveChatRoomHandler extends BaseHandler<ILeaveChatRoomData> {
  protected async executeImpl({ roomId }: ILeaveChatRoomData) {
    const room = await this.getObject("ChatRoom", roomId);

    if (this.user!.id === room.host) {
      await room.remove();
      return;
    }

    room.users.remove(this.user!.id);
    await room.save();

    this.ok('you leaved chat room "%s"', room.title);
    this.socket.to(roomId).emit("user leaves", this.user!.id);
  }
}

enum UpdateType {
  title = "title",
}
interface IChatRoomUpdateData {
  roomId: string;
  update: { type: UpdateType; payload: any };
}

@RequireUserRole(Role.MOD)
export class ChatRoomUpdateHandler extends BaseHandler<IChatRoomUpdateData> {
  protected async executeImpl({ roomId, update }: IChatRoomUpdateData) {
    const room = await this.getObject("ChatRoom", roomId);
    switch (update.type) {
      case UpdateType.title: {
        const oldTitle = room.title;
        room.title = update.payload;
        await room.save();
        logger.debug('title updated from "%s" to "%s".', oldTitle, room.title);
        this.ok('title updated to "%s"', room.title);
        break;
      }

      default: {
        throw new InternalHandlerError(`unknown update type: "${update.type}"`);
      }
    }

    this.socket.server.to(room.id).emit("room update", update);
  }
}
