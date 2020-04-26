import { Socket } from "socket.io";
import { IUser } from "./models/user";

interface ISocketAuth extends Socket {
  auth?: {
    user: IUser;
  };
}

export type ExtendedSocket = ISocketAuth;
