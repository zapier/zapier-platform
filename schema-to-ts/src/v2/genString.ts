import {
  docStringLines,
  idToTypeName,
  type CompilerContext,
  SchemaCompiler,
  type SchemaPath,
  type TopLevelSchema,
} from './helpers.ts';

import type { JSONSchema4 } from 'json-schema';

type StringSchema = JSONSchema4 & { id: SchemaPath; type: 'string' };

export class StringCompiler extends SchemaCompiler<StringSchema> {
  test(schema: TopLevelSchema): schema is StringSchema {
    return (
      schema !== null &&
      typeof schema === 'object' &&
      'type' in schema &&
      typeof schema.type === 'string' &&
      schema.type === 'string'
    );
  }

  compile(ctx: CompilerContext, schema: StringSchema) {
    const name = idToTypeName(schema.id);
    ctx.file.addTypeAlias({
      leadingTrivia: '\n',
      name,
      isExported: true,
      type: 'string',
      docs: docStringLines(schema.description),
    });
  }
}
