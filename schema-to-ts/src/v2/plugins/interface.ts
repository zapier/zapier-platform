import type { InterfaceDeclaration } from 'ts-morph';
import {
  docStringLines,
  idToTypeName,
  type CompilerContext,
  type SchemaPath,
  type TopLevelSchema,
} from '../helpers.ts';
import renderType from '../renderType.ts';
import { TopLevelPlugin } from './base.ts';

import type { JSONSchema4 } from 'json-schema';

type InterfaceSchema = JSONSchema4 & {
  id: SchemaPath;
  type: 'object';
  properties: Record<string, JSONSchema4>;
};

/**
 * Generates a TypeScript interface from a JSON Schema object, instead
 * of the default type alias.
 *
 * This is the most common, and most advanced top-level schema plugin.
 * Contained within this module is a self-similar compiler-matching
 * system just for the properties of the generated interface.
 */
export default class InterfacePlugin extends TopLevelPlugin<InterfaceSchema> {
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
    // Property compilers MAY override the default behavior.
    // for (const compiler of this.propertyOverrideCompilers) {
    //   if (compiler.test(value)) {
    //     compiler.compile({ ctx, iface, key, value: value as never, required });
    //     return;
    //   }
    // }

    // Otherwise, render the property as normal member of the interface.
    const { rawType, referencedTypes } = renderType(value);
    if (referencedTypes) {
      ctx.schemasToRender.push(...referencedTypes);
    }
    iface.addProperty({
      leadingTrivia: '\n',
      hasQuestionToken: !required,
      name: key,
      type: rawType,
      docs: docStringLines(value.description),
    });
  }
}
