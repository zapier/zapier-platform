import InterfacePlugin from './interfacePlugin.ts';
import { TopLevelPlugin } from '../types.ts';
import type { TopLevelPluginContext } from '../types.ts';
import { docStringLines } from '../helpers.ts';

export default class BasicPollingOperationTypeArgsPlugin extends InterfacePlugin {
  test(ctx: TopLevelPluginContext): boolean {
    if (ctx.schemaPath === '/BasicPollingOperationSchema') {
      this.logger.warn(
        { schemaPath: ctx.schemaPath },
        'Rendering BasicPollingOperationTypeArgsPlugin',
      );
      return true;
    }
    return false;
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
          name: '$Foobar',
          constraint: 'string[]',
        },
      ],
    });

    const requiredProperties = Array.isArray(schema.required)
      ? schema.required
      : [];
    for (const [key, value] of Object.entries(schema.properties ?? {})) {
      this.compileProperty({
        ...ctx,
        iface,
        interfaceName: ctx.schemaTypeName,
        key,
        value,
        required: requiredProperties.includes(key),
      });
    }
  }
}
