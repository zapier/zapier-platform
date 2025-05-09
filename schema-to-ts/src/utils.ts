import type { SchemaPath, ZapierSchemaDocument } from './types.ts';

import { existsSync } from 'fs';
import { pino } from 'pino';
import { readFileSync } from 'fs';

const logLevel = process.env.LOG_LEVEL?.toLowerCase() ?? 'info';

export function idToTypeName(name: string) {
  return name.replace(/^\/?/, '').replace(/Schema$/, '');
}
export function refToSchemaName(name: SchemaPath) {
  return name.replace(/^\/?/, '');
}

export const logger = pino({
  level: logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      ignore: 'time,pid,hostname',
      singleLine: true,
    },
  },
});

export const loadExportedSchemas = (
  schemaJsonPath: string,
): ZapierSchemaDocument => {
  if (!existsSync(schemaJsonPath)) {
    logger.fatal(
      { schemaJsonPath },
      'Schema-json file does not exist, aborting',
    );
    throw new Error(`Schema-json file does not exist: ${schemaJsonPath}`);
  } else {
    logger.info(
      { schemaJsonPath },
      'Successfully found schema-json file to compile.',
    );
  }

  const { version, schemas } = JSON.parse(
    readFileSync(schemaJsonPath, 'utf-8'),
  );
  logger.info(
    {
      schemaJsonPath,
      version,
      numRawSchemas: Object.keys(schemas).length,
    },
    'Loaded %d raw JsonSchemas from zapier-platform-schemas v%s to compile',
    Object.keys(schemas).length,
    version,
  );

  return { version, schemas };
};
