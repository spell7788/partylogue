import * as config from "../config";
import { InternalHandlerError } from "../errors";
import { IMessage, Message } from "../models";
import { AuthUserRegistry } from "../services";
import { isObjectId } from "../utils";
import BaseHandler, { RequireUserRole, UpdatesActivity } from "./base";

interface IPostMessageData {
  roomId: string;
  text: string;
}

const mentionRegex = new RegExp(` *${config.MESSAGE_MENTION_SYMBOL}(\\w+) +`, "gm");

@RequireUserRole()
@UpdatesActivity
export class PostMessageHandler extends BaseHandler<IPostMessageData> {
  protected async executeImpl({ roomId, text }: IPostMessageData) {
    let msg = await Message.create({ room: roomId, sender: this.user!.id, text });
    msg = await msg.populate("sender room").execPopulate();
    this.ok();
    this.socket.server.to(roomId).emit("new message", msg);

    const registry = AuthUserRegistry.getInstance();
    const mentionedUsernames = this.parseMentionedUsernames(msg, registry);
    mentionedUsernames.forEach((username) => {
      const registryValue = registry.get(username);
      if (!registryValue) { return; }
      this.socket.server.to(registryValue.socket.id).emit("new mention", msg);
    });
  }

  protected parseMentionedUsernames(msg: IMessage, registry: AuthUserRegistry): string[] {
    const { room } = msg;
    if (isObjectId(room)) {
      throw new InternalHandlerError("message room must be populated to parse mentions.");
    }

    const mentionedUsernames = [...msg.text.matchAll(mentionRegex)]
      .map(([, username]) => username);
    if (!room.isPrivate) { return mentionedUsernames; }

    return mentionedUsernames.filter((username) => {
      const registryValue = registry.get(username);
      if (!registryValue) { return false; }

      const { user } = registryValue.socket.auth!;
      if (!room.users.includes(user.id)) { return false; }
      return true;
    });
  }
}
