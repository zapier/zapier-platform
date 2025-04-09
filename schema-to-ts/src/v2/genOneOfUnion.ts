import {
  docStringLines,
  idToTypeName,
  isSchemaRef,
  type CompilerContext,
  SchemaCompiler,
  type SchemaPath,
  type TopLevelSchema,
} from './helpers.ts';

import type { JSONSchema4 } from 'json-schema';
import { logger } from '../utils.ts';

type OneOfUnionSchema = JSONSchema4 & {
  id: SchemaPath;
  oneOf: JSONSchema4[];
};

export class OneOfUnionCompiler extends SchemaCompiler<OneOfUnionSchema> {
  test(schema: TopLevelSchema): schema is OneOfUnionSchema {
    return (
      typeof schema === 'object' &&
      schema !== null &&
      'oneOf' in schema &&
      Array.isArray(schema.oneOf)
    );
  }

  compile(ctx: CompilerContext, schema: OneOfUnionSchema) {
    const newName = idToTypeName(schema.id);
    logger.debug({ newName }, 'Adding union type %s', newName);

    schema.oneOf.forEach((member) => {
      if (isSchemaRef(member.$ref)) {
        ctx.schemasToRender.push(member.$ref);
      }
    });
    const memberTypes = schema.oneOf.map(getUnionMemberType).join(' | ');

    ctx.file.addTypeAlias({
      name: newName,
      isExported: true,
      type: memberTypes,
      docs: docStringLines(schema.description),
      leadingTrivia: '\n',
    });
    logger.debug({ newName, memberTypes }, 'Added union type %s', newName);
  }
}

/**
 * Used to render the type of a single union member. Used for `oneOf`
 * and `anyOf` union members.
 */
export function getUnionMemberType(schema: JSONSchema4): string {
  if (schema.$ref) {
    return idToTypeName(schema.$ref);
  }
  if (schema.type === 'string') {
    return 'string';
  }
  if (schema.type === 'number') {
    return 'number';
  }
  if (schema.type === 'boolean') {
    return 'boolean';
  }

  if (
    schema.type === 'array' &&
    schema.items &&
    !Array.isArray(schema.items) &&
    schema.items.$ref
  ) {
    const name = getUnionMemberType(schema.items);
    return `${name}[]`;
  }
  throw new Error(`Unknown union member type: ${JSON.stringify(schema)}`);
}
