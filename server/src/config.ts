import * as env from "env-var";

export const DEBUG = env.get("DEBUG")
  .default("false").asBool();

export const LOG_LEVEL = env.get("LOG_LEVEL")
  .default("info").asString();

export const PORT = env.get("PORT")
  .default(8000).asPortNumber();

export const DB_CONNECTION_URI = env.get("DB_CONNECTION_URI")
  .default("mongodb://db:27017/db").asString();

export const JWT_SECRET = env.get("JWT_SECRET")
  .required().asString();

export const ACTIVE_MINUTES = env.get("ACTIVE_MINUTES")
  .default(4).asIntPositive();

export const MAX_MESSAGES_PER_CHAT_ROOM = env.get("MAX_MESSAGES_PER_CHAT_ROOM")
  .default(100).asIntPositive();

export const CHAT_ROOM_LIST_LIMIT = env.get("CHAT_ROOM_LIST_LIMIT")
  .default(10).asIntPositive();

export const JOINED_USERS_DISPLAY_LIMIT = env.get("JOINED_USERS_DISPLAY_LIMIT")
  .default(2).asIntPositive();

export const OBTAIN_ADMIN_CODE = env.get("OBTAIN_ADMIN_CODE")
  .asString();

export const MESSAGE_MENTION_SYMBOL = env.get("MESSAGE_MENTION_SYMBOL")
  .asString();
