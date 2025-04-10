import type { JSONSchema4 } from 'json-schema';
import { type SchemaPath, isSchemaRef, renderRawType } from '../helpers.ts';
import {
  PropertyCompiler,
  type CompilePropertyArgs,
} from './propertyCompiler.ts';

type AnyOfSchema = JSONSchema4 & {
  anyOf: (JSONSchema4 & { $ref?: SchemaPath })[];
};

export default class AnyOfPropertyCompiler extends PropertyCompiler<AnyOfSchema> {
  test(value: unknown): value is AnyOfSchema {
    return (
      typeof value === 'object' &&
      value !== null &&
      'anyOf' in value &&
      Array.isArray(value.anyOf)
    );
  }

  compile({
    ctx,
    iface,
    key,
    value,
    required,
  }: CompilePropertyArgs<AnyOfSchema>): void {
    // Add any referenced schemas to the render queue
    value.anyOf.forEach((member) => {
      if (member.$ref && isSchemaRef(member.$ref)) {
        ctx.schemasToRender.push(member.$ref);
      }
    });

    const union = value.anyOf
      .map((member): string => {
        try {
          return renderRawType(member).rawType;
        } catch (err) {
          this.logger.error(
            { member },
            'Error rendering member of "%s" anyOf union',
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
