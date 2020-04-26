import pino from "pino";
import * as config from "./config";

export default pino({
  level: config.LOG_LEVEL,
  prettyPrint: config.DEBUG ? { forceColor: true } : false,
});
