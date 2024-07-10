import { pino } from 'pino';

const logLevel = process.env.LOG_LEVEL?.toLowerCase() ?? 'info';

export const logger = pino({
  level: logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      ignore: 'pid,hostname',
      singleLine: true,
    },
  },
});

/**
 * Convert a raw schemas name to a pretty version, dropping suffix
 * numbers and the "Schema" suffix.
 */
export const prettyName = (name: string) =>
  name.replace(/\d+$/, '').replace(/Schema$/, '');

/**
 * Maps in JS are ordered, but you can't insert at the start. This is a
 * helper that cheats by creating a new map with the new item first.
 */
export const insertAtFront = <K, V>(
  map: Map<K, V>,
  key: K,
  value: V,
): Map<K, V> => new Map([[key, value], ...Array.from(map.entries())]);
