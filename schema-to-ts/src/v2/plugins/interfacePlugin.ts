import type {
  InterfaceDeclaration,
  PropertySignatureStructure,
} from 'ts-morph';
import { docStringLines } from '../helpers.ts';
import renderType from '../renderType.ts';
import {
  TopLevelPlugin,
  type PropertyPluginContext,
  type TopLevelPluginContext,
} from '../types.ts';
import { INTERFACE_PROPERTY_PLUGINS } from './index.ts';

/**
 * Effectively global overrides to declaratively modify certain
 * properties on certain schemas.
 */
const SCHEMA_PROPERTY_OVERRIDES: Record<
  string,
  Record<string, Partial<PropertySignatureStructure>>
> = {
  '/BasicPollingOperationSchema': {
    inputFields: { type: '$InputFields' },
    perform: { type: 'Request | PollingTriggerPerform<$InputFields>' },
  },
  '/BasicHookOperationSchema': {
    inputFields: { type: '$InputFields' },
    perform: { type: 'WebhookTriggerPerform<$InputFields>' },
    performList: { type: 'Request | WebhookTriggerPerformList<$InputFields>' },
    performSubscribe: {
      type: 'Request | WebhookTriggerPerformSubscribe<$InputFields>',
    },
    performUnsubscribe: {
      type: 'Request | WebhookTriggerPerformUnsubscribe<$InputFields>',
    },
  },
  '/BasicHookToPollOperationSchema': {
    inputFields: { type: '$InputFields' },
    performList: {
      type: 'Request | HookToPollTriggerPerformList<$InputFields>',
    },
    performSubscribe: {
      type: 'Request | HookToPollTriggerPerformSubscribe<$InputFields>',
    },
    performUnsubscribe: {
      type: 'Request | HookToPollTriggerPerformUnsubscribe<$InputFields>',
    },
  },
  '/BasicCreateActionOperationSchema': {
    inputFields: { type: '$InputFields' },
    perform: { type: 'Request | CreatePerform<$InputFields>' },
    performResume: {
      type: 'Request | CreatePerformResume<$InputFields>',
    },
    performGet: {
      type: 'Request | CreatePerformGet<$InputFields>',
    },
  },
  // Search: Uses BasicActionOperationSchema
  '/BasicActionOperationSchema': {
    inputFields: { type: '$InputFields' },
    perform: { type: 'Request | SearchPerform<$InputFields>' },
    performResume: {
      type: 'Request | SearchPerformResume',
    },
    performGet: {
      type: 'Request | SearchPerformGet<$InputFields>',
    },
  },
};

/**
 * Generates a TypeScript interface from a JSON Schema object, instead
 * of the default type alias.
 *
 * This is the most commonly used plugin that will convert most schemas
 * into interfaces.
 *
 * Contained within is a self-similar system for property plugins to
 * optionally modify the output of the rendered properties inside the
 * interface.
 */
export default class InterfacePlugin extends TopLevelPlugin {
  test({ schema }: TopLevelPluginContext): boolean {
    return (
      typeof schema === 'object' &&
      schema !== null &&
      'type' in schema &&
      schema.type === 'object' &&
      'properties' in schema
    );
  }

  render(ctx: TopLevelPluginContext) {
    const { schema, file } = ctx;

    const iface = file.addInterface({
      name: ctx.schemaTypeName,
      isExported: true,
      docs: docStringLines(schema.description),
      leadingTrivia: '\n',
    });

    this.renderProperties(ctx, iface);
  }

  /**
   * Render all properties of the interface. Convenient to just override
   * the renderProperty method in subclasses if looking to patch
   * individual properties.
   */
  protected renderProperties(
    ctx: TopLevelPluginContext,
    iface: InterfaceDeclaration,
  ) {
    const { schema } = ctx;

    const requiredProperties = Array.isArray(schema.required)
      ? schema.required
      : [];
    for (const [key, value] of Object.entries(schema.properties ?? {})) {
      this.renderProperty({
        ...ctx,
        iface,
        interfaceName: ctx.schemaTypeName,
        key,
        value,
        required: requiredProperties.includes(key),
      });
    }
  }

  protected renderProperty(ctx: PropertyPluginContext) {
    // Property plugins MAY override the default behavior.
    if (this.maybeRenderWithPropertyPlugin(ctx)) {
      return;
    }

    const override = SCHEMA_PROPERTY_OVERRIDES[ctx.schemaPath]?.[ctx.key];

    // Otherwise, render the property as normal member of the interface.
    const { rawType, referencedTypes } = renderType(ctx.value);
    if (referencedTypes && !override?.type) {
      ctx.schemasToRender.push(...referencedTypes);
    }

    ctx.iface.addProperty({
      leadingTrivia: '\n',
      hasQuestionToken: !ctx.required,
      name: ctx.key,
      type: rawType,
      docs: docStringLines(ctx.value.description),
      ...override,
    });
  }

  protected maybeRenderWithPropertyPlugin(ctx: PropertyPluginContext) {
    for (const propertyPlugin of INTERFACE_PROPERTY_PLUGINS) {
      if (propertyPlugin.test(ctx)) {
        this.logger.debug(
          'Rendering property with %s plugin',
          propertyPlugin.constructor.name,
        );
        propertyPlugin.render(ctx);
        return true;
      }
    }
    return false;
  }
}
