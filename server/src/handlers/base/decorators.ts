import { InternalHandlerError } from "../../errors";
import logger from "../../logger";
import { Role } from "../../models";

export function RequireUserRole(minRequiredRole: Role = Role.USER) {
  return (target: any): any => {

    return class extends target {
      public async execute() {
        if (!this.user) {
          throw new InternalHandlerError(
            `user is required for "${this.constructor.name}" handler.`,
          );
        }

        const userRole = this.user.getDominantRole(this.data.roomId);
        if (userRole < minRequiredRole) {
          throw new InternalHandlerError(
            `at least "${minRequiredRole}" role is required.`,
          );
        }

        await super.execute();
      }
    };

  };
}

export function UpdatesActivity(target: any): any {
  return class extends target {
    public async execute() {
      await super.execute();
      if (!this.user) {
        logger.debug(
          'no user on activity update. handler: "%s".', this.constructor.name,
        );
        return;
      }

      this.user.active();
    }
  };
}
