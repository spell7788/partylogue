import { CommandError } from "../errors";
import logger from "../logger";
import { GlobalRole, User } from "../models";

type SubDataType = [string?, string?];
export default async function(_: string, sub: string[]) {
  const [username] = (sub as SubDataType);
  if (!username) {
    throw new CommandError("username is required.");
  }
  let [, newGlobalRole] = (sub as SubDataType);
  if (newGlobalRole === undefined) {
    throw new CommandError("role value is required.");
  }
  newGlobalRole = newGlobalRole.toUpperCase();
  if (!(newGlobalRole in GlobalRole)) {
    throw new CommandError(`correct role is required [user, global_mod, admin]`);
  }
  const user = await User.findOne({ username });
  if (!user) {
    throw new CommandError(`no user with username "${username}" found.`);
  }

  const { global: oldGlobalRoleValue } = user.roles;
  user.roles.global = GlobalRole[newGlobalRole as "USER" | "GLOBAL_MOD" | "ADMIN"];
  try {
    await user.save();
  } catch (err) {
    throw CommandError.from(
      err, `can't assign new role "${newGlobalRole}" to the user"${user.username}"`,
    );
  }
  logger.info(
    'global role of "%s" updated from "%s" to "%s".',
    user.username, GlobalRole[oldGlobalRoleValue], GlobalRole[user.roles.global],
  );
}
