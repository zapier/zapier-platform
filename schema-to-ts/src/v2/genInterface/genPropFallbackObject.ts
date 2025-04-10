import type { JSONSchema4 } from 'json-schema';

import {
  PropertyCompiler,
  type CompilePropertyArgs,
} from './propertyCompiler.ts';

type FallbackObjectSchema = JSONSchema4 & {
  type: 'object';
};

/**
 * Fallback compiler for otherwise unspecified "object" properties that
 * don't have any other specific details. Sets to `Record<string, unknown>`.
 */
export default class FallbackObjectPropertyCompiler extends PropertyCompiler<FallbackObjectSchema> {
  test(value: unknown): value is FallbackObjectSchema {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      value.type === 'object'
    );
  }

  compile({
    iface,
    key,
    value,
    required,
  }: CompilePropertyArgs<FallbackObjectSchema>): void {
    this.addPlainProperty({
      iface,
      key,
      required,
      type: 'Record<string, unknown>',
      docs: value.description,
    });
  }
}
