// @ts-ignore
import jwt from "node-webtokens";
import * as config from "../config";
import { User } from "../models";
import { ExtendedSocket as Socket } from "../types";

export async function authMiddleware(socket: Socket, next: (err?: any) => void) {
  const { token } = socket.handshake.query;
  if (!token) {
    return next();
  }

  const parsedToken = jwt.parse(token).verify(config.JWT_SECRET);
  if (parsedToken.error) {
    return next(parsedToken.error);
  }

  const userId = parsedToken.payload.sub;
  let user = null;
  try {
    user = await User.findById(userId);
  } catch (err) {
    return next(err);
  }
  if (!user) {
    return next(`no user with id: ${userId}`);
  }

  socket.auth = { user };
  next();
}

export default authMiddleware;
