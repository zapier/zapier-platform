import type { InterfaceDeclaration } from 'ts-morph';
import type { JSONSchema4 } from 'json-schema';
import { type CompilerContext, type SchemaPath } from '../helpers.ts';
import { PropertyCompiler } from './propertyCompiler.ts';

type EnumSchema = JSONSchema4 & {
  id: SchemaPath;
  type: 'string';
  enum: string[];
};

export class EnumPropertyCompiler extends PropertyCompiler<EnumSchema> {
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

  compile(
    ctx: CompilerContext,
    iface: InterfaceDeclaration,
    key: string,
    value: EnumSchema,
    required: boolean,
  ): void {
    const union = value.enum.map((e) => `'${e}'`).join(' | ');
    iface.addProperty({
      name: key,
      type: union,
      leadingTrivia: '\n',
      hasQuestionToken: !required,
    });
  }
}
