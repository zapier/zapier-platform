import type { JSONSchema4 } from 'json-schema';
import { type SchemaPath, isSchemaRef, idToTypeName } from '../helpers.ts';
import {
  PropertyCompiler,
  type CompilePropertyArgs,
} from './propertyCompiler.ts';

type RefSchema = JSONSchema4 & {
  $ref: SchemaPath;
  type?: string;
};

export default class RefPropertyCompiler extends PropertyCompiler<RefSchema> {
  test(value: unknown): value is RefSchema {
    return (
      typeof value === 'object' &&
      value !== null &&
      '$ref' in value &&
      isSchemaRef(value.$ref)
    );
  }

  compile({
    ctx,
    iface,
    key,
    value,
    required,
  }: CompilePropertyArgs<RefSchema>): void {
    this.addPlainProperty({
      iface,
      key,
      required,
      type: idToTypeName(value.$ref),
      docs: value.description,
    });
    ctx.schemasToRender.push(value.$ref);
  }
}
