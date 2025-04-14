import type { PropertyPluginContext, TopLevelPluginContext } from '../types.ts';

import InterfacePlugin from './interfacePlugin.ts';
import { docStringLines } from '../helpers.ts';

const TriggerTypes: Record<string, string> = {
  '/BasicPollingOperationSchema': 'PollingTrigger',
  '/BasicHookOperationSchema': 'HookTrigger',
  '/BasicHookToPollOperationSchema': 'HookToPollTrigger',
} as const;

/**
 * Render three Trigger schemas for each operation types, with the
 * operation fixed instead of a union.
 *
 * Also adds $InputFields type parameter to the interface and operations.
 */
export default class TriggerTypeArgsPlugin extends InterfacePlugin {
  test(ctx: TopLevelPluginContext): boolean {
    return ctx.schemaPath === '/TriggerSchema';
  }

  render(ctx: TopLevelPluginContext) {
    const { schema, file } = ctx;

    const operations = schema.properties?.operation?.anyOf;
    if (!operations) {
      throw new Error('TriggerSchema expected to have an "operation" property');
    }

    // Split the operations and render them each as a different
    // interface with an operation-specific name.
    for (const operation of operations) {
      if (!(operation.$ref! in TriggerTypes)) {
        throw new Error(`Unknown operation schema: ${operation.$ref}`);
      }
      const triggerTypeName = TriggerTypes[operation.$ref!]!;

      const iface = file.addInterface({
        name: triggerTypeName,
        isExported: true,
        docs: docStringLines(schema.description),
        leadingTrivia: '\n',
        typeParameters: [
          {
            name: '$InputFields',
            constraint: 'DynamicInputFields',
          },
        ],
      });

      const operationCtx: TopLevelPluginContext = {
        ...ctx,
        schema: { ...ctx.schema, operation },
      };

      super.renderProperties(operationCtx, iface);
    }
  }

  renderProperty(ctx: PropertyPluginContext) {
    if (ctx.key === 'operation') {
      ctx.iface.addProperty({
        name: 'operation',
        type: 'BasicPollingOperation<$InputFields>',
        docs: docStringLines(ctx.value.description),
        leadingTrivia: '\n',
      });
    } else {
      super.renderProperty(ctx);
    }
  }
}
