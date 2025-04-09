import type { InterfaceDeclaration } from 'ts-morph';
import {
  docStringLines,
  idToTypeName,
  isSchemaRef,
  type CompilerContext,
  type SchemaPath,
  type TopLevelSchema,
  SchemaCompiler,
} from '../helpers.ts';

import type { JSONSchema4 } from 'json-schema';
import { EnumPropertyCompiler } from './genPropEnum.ts';
import { RefPropertyCompiler } from './genPropRef.ts';

type InterfaceSchema = JSONSchema4 & {
  id: SchemaPath;
  type: 'object';
  properties: Record<string, JSONSchema4>;
};

export class InterfaceCompiler extends SchemaCompiler<InterfaceSchema> {
  private propertyCompilers = [
    new RefPropertyCompiler(),
    new EnumPropertyCompiler(),
  ];

  test(schema: TopLevelSchema): schema is InterfaceSchema {
    return (
      typeof schema === 'object' &&
      schema !== null &&
      'type' in schema &&
      schema.type === 'object' &&
      'properties' in schema
    );
  }

  compile(ctx: CompilerContext, schema: InterfaceSchema) {
    const newName = idToTypeName(schema.id);

    const iface = ctx.file.addInterface({
      name: newName,
      isExported: true,
      docs: docStringLines(schema.description),
      leadingTrivia: '\n',
    });

    const requiredProperties = Array.isArray(schema.required)
      ? schema.required
      : [];
    for (const [key, value] of Object.entries(schema.properties)) {
      this.compileProperty(
        ctx,
        iface,
        key,
        value,
        requiredProperties.includes(key),
      );
    }
  }

  private compileProperty(
    ctx: CompilerContext,
    iface: InterfaceDeclaration,
    key: string,
    value: JSONSchema4,
    required: boolean,
  ) {
    for (const compiler of this.propertyCompilers) {
      if (compiler.test(value)) {
        this.logger.debug(
          { key, value },
          'Compiling property %s with %s',
          key,
          compiler.constructor.name,
        );
        compiler.compile(ctx, iface, key, value as any, required);
        return;
      }
    }

    this.logger.error({ value }, "Unhandled interface property '%s'", key);

    iface.addProperty({
      leadingTrivia: '\n',
      hasQuestionToken: !required,
      name: key,
      type: '__UNIMPLEMENTED__',
    });
  }
}
