import mongoose from "mongoose";
import * as config from "../config";
import logger from "../logger";
import {
  GlobalRole as GRole, IUser, LocalRole as LRole, Role,
} from "../models";
import BaseHandler, { RequireUserRole, UpdatesActivity } from "./base";

interface IAutoCommandArg {
  name: string;
}
interface IManualCommandArg {
  name: string;
  position: number;
  description?: string;
  default?: any;
}
export interface ICommandMeta {
  name: string;
  visible: boolean;
  isManualCommand: boolean;
  minRequiredRole: Role;
  args: ReadonlyArray<IAutoCommandArg | IManualCommandArg>;
}

interface ITargetIdData {
  targetId: string;
  roomId: string;
}
interface ITargetUsernameData {
  targetUsername: string;
  roomId: string;
}
type BaseCommandData = ITargetIdData | ITargetUsernameData;

function isTargetIdData(data: BaseCommandData): data is ITargetIdData {
  return (data as ITargetIdData).targetId !== undefined;
}

abstract class BaseCommandHandler<IDataFields extends BaseCommandData>
extends BaseHandler<IDataFields> {
  public canApplyToSelf: boolean = false;
  private targetUser?: IUser;

  protected async executeImpl(data: BaseCommandData) {
    const targetUser = await this.getTargetUser();
    if (!this.canApplyToSelf && this.user!.id === targetUser.id) {
      this.fail("can't apply command to oneself.");
    }
    const { roomId } = data;
    const userRole = this.user!.getDominantRole(roomId);
    const targetRole = targetUser.getDominantRole(roomId);
    if (userRole <= targetRole && this.user!.id !== targetUser.id) {
      this.fail('targeted user "%s" has the same or higher role.', targetUser.username);
    }
  }

  protected async getTargetUser() {
    if (!this.targetUser) {
      const conditionsOrId = isTargetIdData(this.data)
        ? (this.data as ITargetIdData).targetId
        : { username: (this.data as ITargetUsernameData).targetUsername };
      this.targetUser = await this.getObject("User", conditionsOrId);
    }
    return this.targetUser;
  }
}

interface IRemoveMessageData extends ITargetIdData {
  msgId: string;
}

@RequireUserRole(Role.MOD)
@UpdatesActivity
class RemoveMessageHandler extends BaseCommandHandler<IRemoveMessageData> {
  public static META: ICommandMeta = {
    name: "remove",
    visible: true,
    isManualCommand: false,
    minRequiredRole: Role.MOD,
    args: [
      { name: "roomId" },
      { name: "targetId" },
      { name: "msgId" },
    ],
  };

  public minRequiredRole = Role.MOD;
  public canApplyToSelf = true;

  protected async executeImpl({ msgId }: IRemoveMessageData) {
    await super.executeImpl(this.data);
    const msg = await this.getObject("Message", msgId);
    await msg.remove();
    this.ok();
    this.socket.server
      .to((msg.room as mongoose.Types.ObjectId).toHexString())
      .emit("message removed", msg.id);
  }
}

interface IBanData extends ITargetUsernameData {
  banMinutes?: number;
}

@RequireUserRole(Role.MOD)
@UpdatesActivity
class BanUserHandler extends BaseCommandHandler<IBanData> {
  public static META: ICommandMeta = {
    name: "ban",
    visible: true,
    isManualCommand: true,
    minRequiredRole: Role.MOD,
    args: [
      { name: "roomId" },
      { name: "targetUsername", position: 0, description: "username" },
      { name: "banMinutes", position: 1, description: "*minutes" },
    ],
  };

  public minRequiredRole = Role.MOD;

  public async executeImpl({ banMinutes }: IBanData) {
    await super.executeImpl(this.data);
    const targetUser = await this.getTargetUser();
    logger.debug(
      '"%s" banned for %s minute(s) by "%s".',
      targetUser.username, banMinutes, this.user!.username,
    );
    this.emitToTargetSocket(targetUser, "banned", banMinutes);
    this.ok('you banned "%s" for %d minute(s)', targetUser.username, banMinutes);
  }
}

@RequireUserRole(Role.MOD)
@UpdatesActivity
class UnbanUserHandler extends BaseCommandHandler<ITargetUsernameData> {
  public static META: ICommandMeta = {
    name: "unban",
    visible: true,
    isManualCommand: true,
    minRequiredRole: Role.MOD,
    args: [
      { name: "roomId" },
      { name: "targetUsername", position: 0, description: "username" },
    ],
  };

  public minRequiredRole = Role.MOD;

  protected async executeImpl() {
    await super.executeImpl(this.data);
    const targetUser = await this.getTargetUser();
    this.emitToTargetSocket(targetUser, "unbanned");
    logger.debug(
      '"%s" unbanned by "%s"', targetUser.username, this.user!.username,
    );
    this.ok('you unbanned "%s"', targetUser.username);
    super.executeImpl(this.data);
  }
}

@RequireUserRole(Role.HOST)
@UpdatesActivity
class ModUserHandler extends BaseCommandHandler<ITargetUsernameData> {
  public static META: ICommandMeta = {
    name: "mod",
    visible: true,
    isManualCommand: true,
    minRequiredRole: Role.HOST,
    args: [
      { name: "roomId" },
      { name: "targetUsername", position: 0, description: "username" },
    ],
  };

  protected async executeImpl({ roomId }: ITargetUsernameData) {
    await super.executeImpl(this.data);
    const room = await this.getObject("ChatRoom", roomId);
    const targetUser = await this.getTargetUser();
    if (!room.users.includes(targetUser.id)) {
      this.fail('"%s" is not in the chat room.', targetUser.username);
    }

    if (targetUser.roles.roles.get(room.id) === LRole.HOST) {
      this.fail('you can\'t mod a host user "%s".', targetUser.username);
    }

    targetUser.roles.roles.set(room.id, LRole.MOD);
    await targetUser.save();
    logger.debug(
      '"%s" updated "%s" role to "%s"',
      this.user!.username, targetUser.username, LRole[Role.MOD],
    );
    this.ok('you moded "%s"', targetUser.username);
    this.socket.server.to(room.id).emit("new role", {
      userId: targetUser.id,
      role: [room.id, LRole.MOD],
    });
  }
}

@RequireUserRole(Role.HOST)
@UpdatesActivity
class UnmodUserHandler extends BaseCommandHandler<ITargetUsernameData> {
  public static META: ICommandMeta = {
    name: "unmod",
    visible: true,
    isManualCommand: true,
    minRequiredRole: Role.HOST,
    args: [
      { name: "roomId" },
      { name: "targetUsername", position: 0, description: "username" },
    ],
  };

  protected async executeImpl({ roomId }: ITargetUsernameData) {
    await super.executeImpl(this.data);
    const targetUser = await this.getTargetUser();

    if (targetUser.roles.roles.get(roomId) !== LRole.MOD) {
      this.fail('"%s" is not a mod.', targetUser.username);
    }

    targetUser.roles.roles.delete(roomId);
    await targetUser.save();
    logger.debug(
      '"%s" updated "%s" role to "%s"',
      this.user!.username, targetUser.username, LRole[Role.USER],
    );
    this.ok('you unmodded "%s"', targetUser.username);
    this.socket.server.to(roomId).emit("new role", {
      userId: targetUser.id,
      role: [roomId, LRole.USER],
    });
  }
}

@RequireUserRole(Role.ADMIN)
@UpdatesActivity
class GlobalModUserHandler extends BaseCommandHandler<ITargetUsernameData> {
  public static META: ICommandMeta = {
    name: "gmod",
    visible: true,
    isManualCommand: true,
    minRequiredRole: Role.ADMIN,
    args: [
      { name: "roomId" },
      { name: "targetUsername", position: 0, description: "username" },
    ],
  };

  protected async executeImpl({ roomId }: ITargetUsernameData) {
    await super.executeImpl(this.data);
    const targetUser = await this.getTargetUser();
    targetUser.roles.global = GRole.GLOBAL_MOD;
    await targetUser.save();
    logger.debug(
      '"%s" updated "%s" role to "%s"',
      this.user!.username, targetUser.username, GRole[Role.GLOBAL_MOD],
    );
    this.ok('you updated "%s" role to "%s"', targetUser.username, GRole[Role.GLOBAL_MOD]);
    this.socket.server.to(roomId).emit("new role", {
      userId: targetUser.id,
      role: GRole.GLOBAL_MOD,
    });
  }
}

@RequireUserRole(Role.ADMIN)
@UpdatesActivity
class UnGlobalModUserHandler extends BaseCommandHandler<ITargetUsernameData> {
  public static META: ICommandMeta = {
    name: "ungmod",
    visible: true,
    isManualCommand: true,
    minRequiredRole: Role.ADMIN,
    args: [
      { name: "roomId" },
      { name: "targetUsername", position: 0, description: "username" },
    ],
  };

  protected async executeImpl({ roomId }: ITargetUsernameData) {
    await super.executeImpl(this.data);
    const targetUser = await this.getTargetUser();

    if (targetUser.roles.global !== GRole.GLOBAL_MOD) {
      this.fail('"%s" is not a global mod.', targetUser.username);
    }

    targetUser.roles.global = GRole.USER;
    await targetUser.save();
    logger.debug(
      '"%s" updated "%s" role to "%s"',
      this.user!.username, targetUser.username, GRole[Role.USER],
    );
    this.ok('you updated "%s" role to "%s"', targetUser.username, GRole[Role.USER]);
    this.socket.server.to(roomId).emit("new role", {
      userId: targetUser.id,
      role: GRole.USER,
    });
  }
}

interface IObtainAdminRoleData {
  code: string;
}

@RequireUserRole()
class ObtainAdminRoleHandler extends BaseHandler<IObtainAdminRoleData> {
  public static META: ICommandMeta = {
    name: "admin",
    visible: false,
    isManualCommand: true,
    minRequiredRole: Role.USER,
    args: [
      { name: "code", position: 0 },
    ],
  };

  protected async executeImpl({ code }: IObtainAdminRoleData) {
    if (!config.OBTAIN_ADMIN_CODE) {
      logger.warn("obtain admin role code is not set.");
      return;
    }

    if (code !== config.OBTAIN_ADMIN_CODE) {
      logger.debug({ code }, "obtain admin role code is invalid.");
      return;
    }

    if (this.user!.roles.global === GRole.ADMIN) {
      this.ok("you are already admin.");
      return;
    }

    this.user!.roles.global = GRole.ADMIN;
    await this.user!.save();
    logger.debug('admin role has been obtained through code by "%s"', this.user!.username);
    this.ok("you successfully obtained admin role.");
  }
}

export const commands: Record<string, any> = {
  remove: RemoveMessageHandler,
  ban:    BanUserHandler,
  unban:  UnbanUserHandler,
  mod:    ModUserHandler,
  unmod:  UnmodUserHandler,
  gmod:   GlobalModUserHandler,
  ungmod: UnGlobalModUserHandler,
  admin:  ObtainAdminRoleHandler,
};

type CommandArgs = Record<string, any>;
interface IRunCommandData { command: string; args: CommandArgs; }
export class RunCommandHandler extends BaseHandler<IRunCommandData> {
  protected async executeImpl({ command, args }: IRunCommandData) {
    const handlerClass = commands[command];
    if (!handlerClass) {
      logger.debug('no command handler for "%s" command.', command);
      this.fail('invalid command: "%s".', command);
    }

    new handlerClass(this.socket, args, this.ackFn).execute();
  }
}
