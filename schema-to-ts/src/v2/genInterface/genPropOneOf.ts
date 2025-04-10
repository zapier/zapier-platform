import type { JSONSchema4 } from 'json-schema';
import { type SchemaPath, isSchemaRef, renderRawType } from '../helpers.ts';
import {
  PropertyCompiler,
  type CompilePropertyArgs,
} from './propertyCompiler.ts';

type OneOfSchema = JSONSchema4 & {
  oneOf: (JSONSchema4 & { $ref?: SchemaPath })[];
};

export default class OneOfPropertyCompiler extends PropertyCompiler<OneOfSchema> {
  test(value: unknown): value is OneOfSchema {
    return (
      typeof value === 'object' &&
      value !== null &&
      'oneOf' in value &&
      Array.isArray(value.oneOf)
    );
  }

  compile({
    ctx,
    iface,
    key,
    value,
    required,
  }: CompilePropertyArgs<OneOfSchema>): void {
    // Add any referenced schemas to the render queue
    value.oneOf.forEach((member) => {
      if (member.$ref && isSchemaRef(member.$ref)) {
        ctx.schemasToRender.push(member.$ref);
      }
    });

    const union = value.oneOf
      .map((member): string => {
        try {
          return renderRawType(member).rawType;
        } catch (err) {
          this.logger.error(
            { member },
            'Error rendering member of "%s" oneOf union',
            key,
          );
          throw err;
        }
      })
      .join(' | ');
    this.addPlainProperty({
      iface,
      key,
      required,
      type: union,
      docs: value.description,
    });
  }
}
