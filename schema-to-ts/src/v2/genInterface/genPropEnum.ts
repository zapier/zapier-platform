import type { JSONSchema4 } from 'json-schema';

import {
  PropertyCompiler,
  type CompilePropertyArgs,
} from './propertyCompiler.ts';

type EnumSchema = JSONSchema4 & {
  type: 'string';
  enum: string[];
};

export default class EnumPropertyCompiler extends PropertyCompiler<EnumSchema> {
  test(value: unknown): value is EnumSchema {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      value.type === 'string' &&
      'enum' in value &&
      Array.isArray(value.enum)
    );
  }

  compile({
    iface,
    key,
    value,
    required,
  }: CompilePropertyArgs<EnumSchema>): void {
    const union = value.enum.map((e) => `'${e}'`).join(' | ');
    this.addPlainProperty({
      iface,
      key,
      required,
      type: union,
      docs: value.description,
    });
  }
}
