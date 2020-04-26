import bcrypt from "bcryptjs";
import mongoose from "mongoose";
// @ts-ignore
import jwt from "node-webtokens";
import * as config from "../config";
import logger from "../logger";
import { GlobalRole, User, IUser } from "../models";
import { AuthUserRegistry } from "../services";
import BaseHandler, { RequireUserRole, UpdatesActivity } from "./base";
import { commands, ICommandMeta } from "./command";

interface ISignInData {
  username: string;
  password: string;
}

@UpdatesActivity
export class SignInHandler extends BaseHandler<ISignInData> {
  protected async executeImpl({ username, password }: ISignInData) {
    const user = await this.getObject("User", { username });
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      this.fail("invalid password.");
    }

    const token = jwt.generate("HS256", { sub: user.id }, config.JWT_SECRET);
    this.socket.auth = { user };
    const registry = AuthUserRegistry.getInstance();
    registry.set(this.socket);

    this.ok({ user, token, commands: [] });
    logger.debug(
      'user [%s] "%s"  signed in. token: "%s"',
      GlobalRole[user.roles.global].toLowerCase(), user.username, token,
    );
  }

  protected getUserCommands(): ICommandMeta[] {
    if (this.socket.auth && this.socket.auth.user) {
      const { user } = this.socket.auth;
      const userCommands: ICommandMeta[] = [];
      for (const handler of Object.values(commands)) {
        if ((handler.META as ICommandMeta).minRequiredRole > user.roles.global) {
          continue;
        }

        userCommands.push(handler.META);
      }

      if (userCommands.length > 0) { return userCommands; }
    }

    return [];
  }
}

@RequireUserRole()
export class SignOutHandler extends BaseHandler {
  protected async executeImpl() {
    const { user } = this.socket.auth!;
    user.inactive();

    const registry = AuthUserRegistry.getInstance();
    registry.delete(this.socket);

    delete this.socket.auth;
    logger.debug('user "%s" signed out.', user.username);
  }
}

interface IRegisterData {
  username: string;
  password: string;
  email: string;
}

const MIN_PASSWORD_LENGTH = 6;

export class RegisterHandler extends BaseHandler<IRegisterData> {
  protected async executeImpl({ password, ...restData }: IRegisterData) {
    if (password && password.length < MIN_PASSWORD_LENGTH) {
      this.fail("password length have to be at least %d characters", MIN_PASSWORD_LENGTH);
    }

    const passwordHash = await bcrypt.hash(password, 5);
    let user: IUser | undefined;
    try {
      user = await User.create({ passwordHash, ...restData });
    } catch (err) {
      if (err instanceof mongoose.Error.ValidationError) {
        // const errors = Object.entries(err.errors)
        //   .map(([path, e]) => [path, e.message]);

        // TODO: errors passing
        this.fail("failed to create user account");
      } else {
        throw err;
      }
    }

    this.ok(user);
  }
}
