import * as config from "../config";
import { IUser } from "../models";
import { ExtendedSocket as Socket } from "../types";
import { Singleton } from "../utils";

class UserActivityStatus {
  public userId: string;
  protected timeout: NodeJS.Timeout | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  public setActive(offlineHandler?: (id: string) => void): void {
    const timeout = setTimeout(() => {
      this.setInactive();
      if (offlineHandler) {
        offlineHandler(this.userId);
      }
    }, config.ACTIVE_MINUTES * 60 * 1000);

    this.setInactive();
    this.timeout = timeout;
  }

  public setInactive(): void {
    if (!this.timeout) { return; }
    clearTimeout(this.timeout);
    this.timeout = null;
  }

  public get isActive(): boolean {
    return !!this.timeout;
  }
}

interface IRegistryValue {
  socket: Socket;
  activityStatus: UserActivityStatus;
}

export class AuthUserRegistry extends Singleton<AuthUserRegistry>() {
  private registry = new Map<string, IRegistryValue>();

  public get(idOrUsername: string): IRegistryValue | undefined {
    return this.registry.get(idOrUsername);
  }

  public set(socket: Socket): IRegistryValue | undefined {
    if (!socket.auth) { return; }
    const { user } = socket.auth;
    const value = { socket, activityStatus: new UserActivityStatus(user.id) };
    this.registry.set(user.id, value);
    this.registry.set(user.username, value);
    return value;
  }

  public delete(socket: Socket): [IUser, Socket] | undefined {
    if (!socket.auth) { return; }
    const { user } = socket.auth;
    this.registry.delete(user.id);
    this.registry.delete(user.username);
    return [user, socket];
  }
}

export default AuthUserRegistry;
