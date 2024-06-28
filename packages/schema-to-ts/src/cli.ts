#!/usr/bin/env node

import { Command } from 'commander';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { cwd } from 'process';

import { applyAllTransformations } from './transformers.js';
import { format } from './formatter.js';
import { generateTypeScript } from './generation.js';
import { compileNodesFromSchemas } from './precompile.js';
import { logger } from './utils.js';

import packageJson from '../package.json' with { type: 'json' };
import { RawSchemaLookup } from './types.js';

const DEFAULT_SCHEMA_JSON_PATH = `${cwd()}/node_modules/zapier-platform-schema/exported-schema.json`;
const DEFAULT_OUTPUT_TS_PATH = `${cwd()}/zapier.generated.d.ts`;

const program = new Command();

program
  .name(packageJson.name)
  .version(packageJson.version)
  .description(packageJson.description);

program.option(
  '-s, --schema-json [file]',
  'The `exported-schema.json` file from zapier-platform-schema to compile from. If not provided, defaults to searching in $CWD/node_modules/zapier-platform-schema/',
);
program.option(
  '-l, --log-level <level>',
  'The log level to use, one of "error", "warning", "info", "debug", "trace".',
  'info',
);
program.option(
  '-o, --output [file]',
  'The file to write the generated TypeScript to. If not provided, defaults to stdout.',
);

const main = async () => {
  program.parse();
  const options = program.opts();

  if (options.logLevel) {
    logger.level = options.logLevel;
  }

  // Load the schema JSON file.
  let schemaJsonPath = options.schemaJson;
  if (!schemaJsonPath) {
    schemaJsonPath = DEFAULT_SCHEMA_JSON_PATH;
    logger.warn(
      {
        DEFAULT_SCHEMA_JSON_PATH,
      },
      `No --schema-json file provided, attempting to use zapier-platform-schema from node_modules`,
    );
  }
  if (!existsSync(schemaJsonPath)) {
    logger.fatal(
      { schemaJsonPath },
      'Schema-json file does not exist, aborting',
    );
    process.exit(1);
  } else {
    logger.info(
      { schemaJsonPath },
      'Successfully found schema-json file to compile.',
    );
  }
  const rawSchemas = getRawSchemasFromJson(schemaJsonPath);
  logger.info(
    'Loaded %d raw JsonSchemas to compile',
    Object.keys(rawSchemas).length,
  );

  // Compile the schemas into a collection of AST nodes to work with.
  logger.debug('Generating pre-compiled node map');
  const nodeMap = await compileNodesFromSchemas(rawSchemas);
  logger.info({ nodes: nodeMap.size }, 'Generated pre-compiled node map');

  logger.debug('Applying transformations to node map');
  const improvedNodeMap = applyAllTransformations(nodeMap);
  logger.info(
    { nodes: improvedNodeMap.size },
    'Applied transformations to node map',
  );

  logger.debug('Generating TypeScript from transformed node map');
  const rawTypeScript = generateTypeScript(improvedNodeMap);
  logger.info({ bytes: rawTypeScript.length }, 'Generated raw TypeScript');

  logger.debug('Formatting generated TypeScript with Prettier');
  const typescript = await format(rawTypeScript);
  logger.info(
    { bytes: typescript.length },
    'Formatted generated TypeScript with Prettier',
  );

  let output = options.output;
  if (!output) {
    output = `${cwd()}/zapier.generated.d.ts`;
    logger.warn(
      { DEFAULT_OUTPUT_TS_PATH },
      'No output file provided, writing to default location',
    );
  }

  writeFileSync(output, typescript);
  logger.info({ output }, 'Wrote generated TypeScript to file');

  logger.info('Done!');
};

const getRawSchemasFromJson = (schemaJsonPath: string): RawSchemaLookup => {
  const data = JSON.parse(readFileSync(schemaJsonPath, 'utf-8'));
  return data.schemas;
};

main();
