import * as config from "../config";
import * as handlers from "../handlers";
import { io, server } from "../io";
import logger from "../logger";
import authMiddleware from "../middleware/auth";
import { ActivityStatusValue } from "../models";
import { AuthUserRegistry } from "../services";
import { ExtendedSocket as Socket } from "../types";
import { forever } from "../utils";

type EventName = string;
function makeHandlerRegister(socket: Socket) {
  return (eventName: EventName, handlerCls: any) => {
    const handlerFn = (...args: any[]) => new handlerCls(socket, ...args).execute();
    socket.on(eventName, handlerFn);
  };
}

const events: ReadonlyArray<[EventName, any]> = [
  ["sign in",        handlers.SignInHandler],
  ["sign out",       handlers.SignOutHandler],
  ["register",       handlers.RegisterHandler],
  ["view room list", handlers.ViewChatRoomListHandler],
  ["view room",      handlers.ViewChatRoomHandler],
  ["leave room",     handlers.LeaveChatRoomHandler],
  ["create room",    handlers.CreateChatRoomHandler],
  ["remove room",    handlers.RemoveChatRoomHandler],
  ["update room",    handlers.ChatRoomUpdateHandler],
  ["post message",   handlers.PostMessageHandler],
  ["run command",    handlers.RunCommandHandler],
];

export default async function() {
  AuthUserRegistry.init();
  const registry = AuthUserRegistry.getInstance();

  server.listen(config.PORT);

  io.use(authMiddleware);

  io.on("connect", (socket: Socket) => {
    registry.set(socket);

    const register = makeHandlerRegister(socket);
    events.forEach(([eventName, handlerCls]) => register(eventName, handlerCls));

    socket.on("disconnect", () => {
      const deleted = registry.delete(socket);
      if (!deleted) { return; }
      const [ user ] = deleted;
      socket.broadcast.emit("user activity status", {
        userId: user.id, status: ActivityStatusValue.DISCONNECTED,
      });
    });
  });

  server.on("listening", () => {
    logger.info({ address: server.address() }, "started to serve");
  });

  await forever();
}
