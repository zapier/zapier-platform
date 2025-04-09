import type { InterfaceDeclaration } from 'ts-morph';
import type { JSONSchema4 } from 'json-schema';
import {
  type CompilerContext,
  type SchemaPath,
  isSchemaRef,
  idToTypeName,
} from '../helpers.ts';
import { PropertyCompiler } from './propertyCompiler.ts';

type RefSchema = JSONSchema4 & {
  $ref: SchemaPath;
  type?: string;
};

export class RefPropertyCompiler extends PropertyCompiler<RefSchema> {
  test(value: unknown): value is RefSchema {
    return (
      typeof value === 'object' &&
      value !== null &&
      '$ref' in value &&
      isSchemaRef(value.$ref)
    );
  }

  compile(
    ctx: CompilerContext,
    iface: InterfaceDeclaration,
    key: string,
    value: RefSchema,
    required: boolean,
  ): void {
    iface.addProperty({
      leadingTrivia: '\n',
      hasQuestionToken: !required,
      name: key,
      type: idToTypeName(value.$ref),
    });
    ctx.schemasToRender.push(value.$ref);
  }
}
