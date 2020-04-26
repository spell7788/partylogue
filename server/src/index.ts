import args from "args";
import mongoose from "mongoose";
import * as commands from "./commands";
import * as config from "./config";
import logger from "./logger";

if (config.DEBUG) {
  mongoose.set("debug", true);
}

const conn = mongoose.connection;
conn.on("connected", () => {
  logger.info("connected to the database");
});

conn.on("disconnected", () => {
  logger.info("database has been disconnected");
});

conn.on("reconnected", () => {
  logger.info("database has been reconnected");
});

conn.on("error", (err) => {
  logger.error(err);
});

conn.on("reconnectFailed", () => {
  logger.error("reconnect to the database failed");
});

function CommandExecutor(command: (...args: any[]) => Promise<void>) {
  return async (...argms: any[]) => {
    await mongoose.connect(config.DB_CONNECTION_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      reconnectInterval: 2000,
    });

    try {
      await command(...argms);
    } finally {
      await mongoose.disconnect();
    }
  };
}

args
  .command("serve", "Serve chat application.", CommandExecutor(commands.serve))
  .command(
    "assignRole", "Assign global role to a user.", CommandExecutor(commands.assignRole),
  );

args.parse(process.argv);
