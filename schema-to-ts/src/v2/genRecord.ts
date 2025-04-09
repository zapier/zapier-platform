import {
  docStringLines,
  idToTypeName,
  isSchemaRef,
  type CompilerContext,
  SchemaCompiler,
} from './helpers.ts';

import type { JSONSchema4 } from 'json-schema';

type RecordSchema = JSONSchema4 & {
  id: string;
  type: 'object';
  patternProperties: Record<string, JSONSchema4 & { $ref: string }>;
};

export class RecordCompiler extends SchemaCompiler<RecordSchema> {
  test(value: unknown): value is RecordSchema {
    return (
      value !== null &&
      typeof value === 'object' &&
      'patternProperties' in value &&
      value.patternProperties !== null &&
      typeof value.patternProperties === 'object'
    );
  }

  compile(ctx: CompilerContext, schema: RecordSchema): void {
    const newName = idToTypeName(schema.id);
    const [innerSchema] = Object.values(schema.patternProperties);

    if (!innerSchema) {
      console.warn('Record schema must have a pattern property');
      return;
    }

    if (!isSchemaRef(innerSchema.$ref)) {
      console.warn('Record schema must have a $ref');
      return;
    }

    const innerType = idToTypeName(innerSchema.$ref);
    ctx.schemasToRender.push(innerSchema.$ref);

    ctx.file.addTypeAlias({
      name: newName,
      isExported: true,
      type: `Record<string, ${innerType}>`,
      docs: docStringLines(schema.description),
      leadingTrivia: '\n',
    });
  }
}
