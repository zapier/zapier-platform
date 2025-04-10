import {
  docStringLines,
  idToTypeName,
  isSchemaRef,
  type CompilerContext,
  SchemaCompiler,
  type SchemaPath,
  type TopLevelSchema,
  renderRawType,
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
    const memberTypes = schema.oneOf
      .map((m) => renderRawType(m).rawType)
      .join(' | ');

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
