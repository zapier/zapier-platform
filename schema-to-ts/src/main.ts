import { Command, Option } from '@commander-js/extra-typings';

import type { CompilerOptions } from './types.js';
import { compileV3 } from './compiler.ts';
import { logger } from './utils.js';

const program = new Command()
  .name(process.env.npm_package_name ?? 'unknown')
  .version(process.env.npm_package_version ?? 'unknown')
  .description(process.env.npm_package_description ?? 'unknown')
  .addOption(
    new Option('-l, --log-level <level>')
      .choices(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .env('LOG_LEVEL')
      .default('info'),
  )
  .option(
    '-s, --schema-json <file>',
    'The `exported-schema.json` file from zapier-platform-schema to compile from. Typically the latest built output from zapier-platform-schema.',
    '../schema/exported-schema.json',
  )
  .option(
    '-o, --output <file>',
    'The file to write the generated TypeScript to. Typically intended to be put in ../core/types as a generated module.',
    '../core/types/schemas.generated.d.ts',
  );

const main = async () => {
  const startTime = performance.now();
  program.parse();
  const options = program.opts();
  if (options.logLevel) {
    logger.level = options.logLevel;
  }
  logger.debug({ options }, 'Parsed CLI options');

  const compilerOptions: CompilerOptions = {
    ...options,
    compilerVersion: process.env.npm_package_version!,
  };
  logger.debug({ compilerOptions }, 'Finalised compiler options');

  logger.info('Using V3 compiler');
  await compileV3(compilerOptions);
  const endTime = performance.now();
  logger.info('Compilation took %d ms', Math.round(endTime - startTime));
  return;
};

await main();
