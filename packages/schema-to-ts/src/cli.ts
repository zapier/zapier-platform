#!/usr/bin/env node

import { CliOptions, CompilerOptions, ZapierSchemaDocument } from './types.js';
import { Command, Option } from 'commander';
import { existsSync, readFileSync, writeFileSync } from 'fs';

import { applyAllTransformations } from './transformers.js';
import { compileNodesFromSchemas } from './precompile.js';
import { format } from './formatter.js';
import { generateTypeScript } from './generation.js';
import { logger } from './utils.js';

const program = new Command();

program
  .name(process.env.npm_package_name!)
  .version(process.env.npm_package_version!)
  .description(process.env.npm_package_description!)
  .addOption(
    new Option('-l, --log-level <level>')
      .choices(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .env('LOG_LEVEL')
      .default('info'),
  )
  .option(
    '-s, --schema-json [file]',
    'The `exported-schema.json` file from zapier-platform-schema to compile from. Typically the latest built output from zapier-platform-schema.',
    '../schema/exported-schema.json',
  )
  .option(
    '-o, --output [file]',
    'The file to write the generated TypeScript to. Typically intended to be put in ../core/types as a generated module.',
    '../core/types/zapier.generated.d.ts',
  )
  .option(
    '--skip-patch-functions',
    'If to skip augmenting the `Function` type with an actual function signature, because raw JSON schema cannot provide the code-level function details. If true, outputs are close 1-1 interfaces for each schema.',
    false,
  )
  .option(
    '--platform-core-custom-import <path>',
    'What import to use for import `ZObject` and `Bundle` from. Defaults to its sibling custom types module in platform-core, but can be overridden to `zapier-platform-core` for example.',
    './zapier.custom',
  );

const main = async () => {
  program.parse();
  const options = program.opts<CliOptions>();
  if (options.logLevel) {
    logger.level = options.logLevel;
  }
  logger.debug({ options }, 'Parsed CLI options');

  // Load the schema JSON file. The `zapier-platform-schema` package
  // has an `exported-schema.json` file of all the schemas we want to
  // compile.
  const schemaJson = options.schemaJson!;
  if (!existsSync(schemaJson)) {
    logger.fatal(
      { schemaJsonPath: schemaJson },
      'Schema-json file does not exist, aborting',
    );
    process.exit(1);
  } else {
    logger.info(
      { schemaJsonPath: schemaJson },
      'Successfully found schema-json file to compile.',
    );
  }
  const { version, schemas } = loadExportedSchemas(schemaJson);
  logger.info(
    {
      schemaJson,
      version,
      numRawSchemas: Object.keys(schemas).length,
    },
    'Loaded %d raw JsonSchemas from zapier-platform-schemas v%s to compile',
    Object.keys(schemas).length,
    version,
  );

  const compilerOptions: CompilerOptions = {
    ...options,
    compilerVersion: process.env.npm_package_version!,
    platformVersion: version,
  };
  logger.debug({ compilerOptions }, 'Finalised compiler options');

  // Compile the schemas into a collection of AST nodes to work with.
  // There is one node for each schema at this stage, and they are in a
  // format that we still want to improve, as the
  // json-schema-to-typescript library does most of the work but has
  // some undesirable results.
  logger.debug('Generating pre-compiled node map');
  const nodeMap = await compileNodesFromSchemas(schemas);
  logger.info({ nodes: nodeMap.size }, 'Generated pre-compiled node map');

  // "Transform" the compiled schemas from a raw AST format into more
  // usable nodes. This is where we cleanup comments, add links to the
  // public docs, and add references to the pre-existing
  // zapier-platform-core types.
  logger.debug('Applying transformations to node map');
  const improvedNodeMap = applyAllTransformations(nodeMap, compilerOptions);
  logger.info(
    { nodes: improvedNodeMap.size },
    'Applied all transformations to node map',
  );

  // Convert the nodes into a string containing real TypeScript code.
  logger.debug('Generating TypeScript from transformed node map');
  const rawTypeScript = generateTypeScript(improvedNodeMap);
  logger.info({ bytes: rawTypeScript.length }, 'Generated raw TypeScript');

  // Format the TypeScript with Prettier before writing it to a file.
  // Necessary because the code-generation step is rather messy.
  logger.debug('Formatting generated TypeScript with Prettier');
  const typescript = await format(rawTypeScript);
  logger.info(
    { bytes: typescript.length },
    'Formatted generated TypeScript with Prettier',
  );

  // Write it to a real file. Defaults to writing it straight to the
  // ../core/types/ directory as `zapier.generated.d.ts`.
  writeFileSync(options.output!, typescript);
  logger.info({ output: options.output }, 'Wrote generated TypeScript to file');

  logger.info('Done!');
};

const loadExportedSchemas = (schemaJsonPath: string): ZapierSchemaDocument =>
  JSON.parse(readFileSync(schemaJsonPath, 'utf-8'));

main();
