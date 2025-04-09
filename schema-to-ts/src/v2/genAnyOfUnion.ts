import {
  docStringLines,
  idToTypeName,
  isSchemaRef,
  type CompilerContext,
  type SchemaPath,
  type TopLevelSchema,
  SchemaCompiler,
} from './helpers.ts';

import type { JSONSchema4 } from 'json-schema';
import { logger } from '../utils.ts';
import { getUnionMemberType } from './genOneOfUnion.ts';

type AnyOfUnionSchema = JSONSchema4 & {
  id: SchemaPath;
  anyOf: JSONSchema4[];
};

export class AnyOfUnionCompiler extends SchemaCompiler<AnyOfUnionSchema> {
  test(schema: TopLevelSchema): schema is AnyOfUnionSchema {
    return (
      typeof schema === 'object' &&
      schema !== null &&
      'anyOf' in schema &&
      Array.isArray(schema.anyOf)
    );
  }

  compile(ctx: CompilerContext, schema: AnyOfUnionSchema) {
    const newName = idToTypeName(schema.id);
    logger.debug({ newName }, 'Adding union type %s', newName);

    schema.anyOf.forEach((member) => {
      if (isSchemaRef(member.$ref)) {
        ctx.schemasToRender.push(member.$ref);
      }
    });
    const memberTypes = schema.anyOf.map(getUnionMemberType).join(' | ');

    ctx.file.addTypeAlias({
      name: newName,
      isExported: true,
      type: memberTypes,
      docs: docStringLines(schema.description),
    });
    logger.debug({ newName, memberTypes }, 'Added union type %s', newName);
  }
}
