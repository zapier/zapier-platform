import type { PropertyPluginContext, TopLevelPluginContext } from '../types.ts';

import { INPUT_FIELDS_TYPE_ARG } from '../constants.ts';
import InterfacePlugin from './interfacePlugin.ts';
import assert from 'assert';
import { docStringLines } from '../helpers.ts';

/**
 * Add $InputFields type parameter to the Trigger interface, and the
 * three operation types.
 */
export default class TriggerTypeArgsPlugin extends InterfacePlugin {
  test(ctx: TopLevelPluginContext): boolean {
    return ctx.schemaPath === '/TriggerSchema';
  }

  render(ctx: TopLevelPluginContext) {
    const { schema, file } = ctx;

    const iface = file.addInterface({
      name: ctx.schemaTypeName,
      typeParameters: [INPUT_FIELDS_TYPE_ARG],
      isExported: true,
      docs: docStringLines(schema.description),
      leadingTrivia: '\n',
    });

    this.renderProperties(ctx, iface);
  }

  renderProperty(ctx: PropertyPluginContext) {
    if (ctx.key === 'operation') {
      this.renderOperationProperty(ctx);
      return;
    }

    super.renderProperty(ctx);
  }

  renderOperationProperty(ctx: PropertyPluginContext) {
    assert.deepStrictEqual(ctx.value?.anyOf, [
      {
        $ref: '/BasicPollingOperationSchema',
      },
      {
        $ref: '/BasicHookOperationSchema',
      },
      {
        $ref: '/BasicHookToPollOperationSchema',
      },
    ]);

    ctx.schemasToRender.push(
      '/BasicPollingOperationSchema',
      '/BasicHookOperationSchema',
      '/BasicHookToPollOperationSchema',
    );

    ctx.iface.addProperty({
      name: 'operation',
      type: 'BasicPollingOperation<$InputFields> | BasicHookOperation<$InputFields> | BasicHookToPollOperation<$InputFields>',
      docs: docStringLines(ctx.value.description),
      leadingTrivia: '\n',
    });
  }
}
