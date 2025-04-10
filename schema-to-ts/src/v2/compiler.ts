import {
  refToSchemaName,
  type CompilerContext,
  type SchemaCompiler,
  type SchemaPath,
} from './helpers.ts';

import type { CompilerOptions } from '../types.ts';
import { Project } from 'ts-morph';
import { format } from '../formatter.ts';
import fs from 'node:fs';
import { logger } from '../utils.ts';
import { InterfaceCompiler } from './genInterface/index.ts';
import { StringCompiler } from './genString.ts';
import { OneOfUnionCompiler } from './genOneOfUnion.ts';
import { AnyOfUnionCompiler } from './genAnyOfUnion.ts';
import { RecordCompiler } from './genRecord.ts';

export async function compileV2({ schemaJson, output }: CompilerOptions) {
  const { version, schemas } = JSON.parse(fs.readFileSync(schemaJson!, 'utf8'));
  logger.info({ version }, 'Loaded %d schemas', Object.keys(schemas).length);

  // File is the ts-morph object used to construct the output file.
  const project = new Project();
  const file = project.createSourceFile('schema.generated.d.ts');

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

  // Done! Format it with prettier and write it to the output file.
  const rawTypeScript = file.getText();
  const formatted = await format(rawTypeScript);
  fs.writeFileSync(output!, formatted);
  logger.info({ output }, 'Wrote generated TypeScript to file');
}

const schemaCompilers = [
  new InterfaceCompiler(),
  new StringCompiler(),
  new OneOfUnionCompiler(),
  new AnyOfUnionCompiler(),
  new RecordCompiler(),
] as const satisfies SchemaCompiler<any>[];

function addTopLevelType(ctx: CompilerContext, schemaName: SchemaPath) {
  const schema = ctx.schemas[refToSchemaName(schemaName)];
  if (!schema) {
    logger.fatal({ schemaName }, 'Top-level schema not found');
    throw new Error(`Top-level schema not found: ${schemaName}`);
  }

  // Skip if we've already added this type.
  if (ctx.renderedSchemas.has(schemaName)) {
    return;
  }
  ctx.renderedSchemas.add(schemaName);
  logger.trace('Beginning compiler search for top-level type %s', schemaName);

  // Work through the per-schema compilers in order of priority,
  // modifying the TS module in the context as we go.
  for (const compiler of schemaCompilers) {
    if (compiler.test(schema)) {
      logger.info(
        'Compiling %s with %s',
        schemaName,
        compiler.constructor.name,
      );
      compiler.compile(ctx, schema as any); // Will be narrowed by the type test.
      logger.debug(
        'Compiled %s with %s',
        schemaName,
        compiler.constructor.name,
      );
      return;
    }
  }
  logger.error('No Compiler matched for top-level schema %s', schemaName);
}
