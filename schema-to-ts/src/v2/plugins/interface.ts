import {
  docStringLines,
  idToTypeName,
  type CompilerContext,
  type SchemaPath,
  type TopLevelSchema,
} from '../helpers.ts';
import renderType from '../renderType.ts';
import {
  TopLevelPlugin,
  PropertyPlugin,
  type PropertyPluginContext,
} from './base.ts';

import type { JSONSchema4 } from 'json-schema';
import BeforeMiddlewarePlugin from './propertyPlugins/beforeMiddleware.ts';
import AfterMiddlewarePlugin from './propertyPlugins/afterMiddleware.ts';

const PROPERTY_PLUGINS: PropertyPlugin[] = [
  new BeforeMiddlewarePlugin(),
  new AfterMiddlewarePlugin(),
];

type InterfaceSchema = JSONSchema4 & {
  id: SchemaPath;
  type: 'object';
  properties: Record<string, JSONSchema4>;
};

/**
 * Generates a TypeScript interface from a JSON Schema object, instead
 * of the default type alias.
 *
 * This is the most commonly used plugin that will convert most schemas
 * into interfaces.
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
    const name = idToTypeName(schema.id);

    const iface = ctx.file.addInterface({
      name: name,
      isExported: true,
      docs: docStringLines(schema.description),
      leadingTrivia: '\n',
    });

    const requiredProperties = Array.isArray(schema.required)
      ? schema.required
      : [];
    for (const [key, value] of Object.entries(schema.properties)) {
      this.compileProperty({
        ...ctx,
        iface,
        interfaceName: name,
        key,
        value,
        required: requiredProperties.includes(key),
      });
    }
  }

  private compileProperty(ctx: PropertyPluginContext) {
    // Property plugins MAY override the default behavior.
    for (const propertyPlugin of PROPERTY_PLUGINS) {
      if (propertyPlugin.test(ctx)) {
        this.logger.debug(
          'Rendering property with %s plugin',
          propertyPlugin.constructor.name,
        );
        propertyPlugin.compile(ctx);
        return;
      }
    }

    // Otherwise, render the property as normal member of the interface.
    const { rawType, referencedTypes } = renderType(ctx.value);
    if (referencedTypes) {
      ctx.schemasToRender.push(...referencedTypes);
    }
    ctx.iface.addProperty({
      leadingTrivia: '\n',
      hasQuestionToken: !ctx.required,
      name: ctx.key,
      type: rawType,
      docs: docStringLines(ctx.value.description),
    });
  }
}
