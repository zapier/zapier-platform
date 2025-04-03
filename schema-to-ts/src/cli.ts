#!/usr/bin/env node

import type { CliOptions, CompilerOptions } from './types.js';
import { Command, Option } from 'commander';
import { compile, loadExportedSchemas } from './main.js';

import { logger } from './utils.js';
import { writeFileSync } from 'fs';

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
    '--skip-patch-perform-function',
    'If to skip augmenting the `Function` type with an actual function signature, because raw JSON schema cannot provide the code-level function details. If true, outputs are close 1-1 interfaces for each schema.',
    false,
  )
  .option(
    '--platform-core-custom-import <path>',
    'What import path to use for the custom `PerformFunction` tpe. Defaults to its sibling custom types module in platform-core, but can be overridden to `zapier-platform-core` for example.',
    './custom',
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
  const { version, schemas } = loadExportedSchemas(options.schemaJson!);

  const compilerOptions: CompilerOptions = {
    ...options,
    compilerVersion: process.env.npm_package_version!,
    platformVersion: version,
  };
  logger.debug({ compilerOptions }, 'Finalised compiler options');

  // Actually compile the schemas into TypeScript!
  const typescript = await compile(schemas, compilerOptions);

  // Write it to a real file. Defaults to writing it straight to the
  // ../core/types/ directory as `zapier.generated.d.ts`.
  writeFileSync(options.output!, typescript);
  logger.info({ output: options.output }, 'Wrote generated TypeScript to file');

  logger.info('Done!');
};

await main();
