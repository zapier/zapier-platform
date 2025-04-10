import {
  docStringLines,
  idToTypeName,
  refToSchemaName,
  type CompilerContext,
  type SchemaPath,
} from './helpers.ts';

import type { CompilerOptions } from '../types.ts';
import { Project } from 'ts-morph';
import { format } from '../formatter.ts';
import fs from 'node:fs';
import { logger } from '../utils.ts';
import InterfacePlugin from './plugins/interface.ts';
import renderType from './renderType.ts';
import type { TopLevelPlugin } from './plugins/base.ts';

/**
 * The top-level interface for compiling the zapier-platform-schema
 * document into a TypeScript file.
 */
export async function compileV2({ schemaJson, output }: CompilerOptions) {
  const { version, schemas } = JSON.parse(fs.readFileSync(schemaJson!, 'utf8'));
  logger.info({ version }, 'Loaded %d schemas', Object.keys(schemas).length);

  // File is the ts-morph object used to construct the output file.
  const project = new Project();
  const file = project.createSourceFile('dummy-value.ts');

  const ctx: CompilerContext = {
    file,
    schemas,
    schemasToRender: ['/AppSchema'], // Root level "entrypoint" schema.
    renderedSchemas: new Set(),
  };

  // Keep adding top-level types until we've added all of them. This
  // lets us ignore things in the schema that aren't used by AppSchema.
  while (ctx.schemasToRender.length > 0) {
    const schemaName = ctx.schemasToRender.shift()!;
    addTopLevelType(ctx, schemaName);
  }

  const allSchemas = Object.keys(schemas).map(
    (k): SchemaPath => `/${k}` as SchemaPath,
  );
  const unrenderedSchemas = allSchemas.filter(
    (s) => !ctx.renderedSchemas.has(s),
  );
  if (unrenderedSchemas.length > 0) {
    logger.warn(
      { unrenderedSchemas },
      '%d schemas unreachable from AppSchema. These have not been added to the output file.',
      unrenderedSchemas.length,
    );
  }

  // Done! Format it with prettier and write it to the output file.
  const rawTypeScript = file.getText();
  const formatted = await format(rawTypeScript);
  fs.writeFileSync(output!, formatted);
  logger.info({ output }, 'Wrote generated TypeScript to file');
}

const TOP_LEVEL_PLUGINS = [
  new InterfacePlugin(),
] as const satisfies TopLevelPlugin<any>[];

function addTopLevelType(ctx: CompilerContext, schemaName: SchemaPath) {
  const schema = ctx.schemas[refToSchemaName(schemaName)];
  if (!schema) {
    logger.fatal({ schemaName }, 'Top-level schema not found');
    throw new Error(`Top-level schema not found: ${schemaName}`);
  }

  // Skip if we've already added this type.
  if (ctx.renderedSchemas.has(schemaName)) {
    logger.trace('Skipping already rendered top-level type %s', schemaName);
    return;
  }
  ctx.renderedSchemas.add(schemaName);

  // Work through the plugins in order of priority, running them if they
  // match the schema. Otherwise, we'll fall back to the default type.
  logger.trace('Beginning plugin search for top-level type %s', schemaName);
  for (const plugin of TOP_LEVEL_PLUGINS) {
    if (plugin.test(schema)) {
      logger.info(
        'Using plugin %s to render %s',
        plugin.constructor.name,
        schemaName,
      );
      plugin.compile(ctx, schema as any); // Will be narrowed by the type test.
      logger.debug(
        'Finished rendering %s with %s',
        schemaName,
        plugin.constructor.name,
      );
      return;
    }
  }

  logger.info('Using default type renderer for %s', schemaName);
  const { rawType, referencedTypes } = renderType(schema);
  if (referencedTypes) {
    ctx.schemasToRender.push(...referencedTypes);
  }
  ctx.file.addTypeAlias({
    name: idToTypeName(schemaName),
    docs: docStringLines(schema.description),
    isExported: true,
    type: rawType,
    leadingTrivia: '\n',
  });
}
