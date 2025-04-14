import InterfacePlugin from './interfacePlugin.ts';
import type { TopLevelPluginContext } from '../types.ts';
import { docStringLines } from '../helpers.ts';

/**
 * Add $InputFields type parameter to the BasicPollingOperation interface
 * and inputFields property.
 */
export default class BasicPollingOperationTypeArgsPlugin extends InterfacePlugin {
  test(ctx: TopLevelPluginContext): boolean {
    return ctx.schemaPath === '/BasicPollingOperationSchema';
  }

  render(ctx: TopLevelPluginContext) {
    const { schema, file } = ctx;

    const iface = file.addInterface({
      name: ctx.schemaTypeName,
      isExported: true,
      docs: docStringLines(schema.description),
      leadingTrivia: '\n',
      typeParameters: [
        {
          name: '$Inputs',
          constraint: 'DynamicInputFields',
        },
      ],
    });

    super.renderProperties(ctx, iface);
  }
}
