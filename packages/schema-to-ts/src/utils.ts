import { pino } from "pino";

const logLevel = process.env.LOG_LEVEL?.toLowerCase() ?? "info";

export const logger = pino({
  level: logLevel,
  transport: {
    target: "pino-pretty",
  },
});

/**
 * Convert a raw schemas name to a pretty version, dropping suffix
 * numbers and the "Schema" suffix.
 */
export const prettyName = (name: string) =>
  name.replace(/\d+$/, "").replace(/Schema$/, "");
