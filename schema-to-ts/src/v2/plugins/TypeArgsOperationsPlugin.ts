import { INPUT_FIELDS_TYPE_ARG } from '../constants.ts';
import InterfacePlugin from './interfacePlugin.ts';
import type { TopLevelPluginContext } from '../types.ts';
import { docStringLines } from '../helpers.ts';

const OPERATION_SCHEMAS = [
  '/BasicPollingOperationSchema',
  '/BasicHookOperationSchema',
  '/BasicHookToPollOperationSchema',
  '/BasicCreateActionOperationSchema',
  '/BasicActionOperationSchema', // Search
];

/**
 * Add $InputFields type parameter to matched XyZOperation interfaces to
 * type their inputFields and perform properties.
 */
export default class TypeArgsOperationsPlugin extends InterfacePlugin {
  test(ctx: TopLevelPluginContext): boolean {
    return OPERATION_SCHEMAS.includes(ctx.schemaPath);
  }

  render(ctx: TopLevelPluginContext) {
    const { schema, file } = ctx;

    const iface = file.addInterface({
      name: ctx.schemaTypeName,
      isExported: true,
      docs: docStringLines(schema.description),
      leadingTrivia: '\n',
      typeParameters: [INPUT_FIELDS_TYPE_ARG],
    });

    super.renderProperties(ctx, iface);
  }
}
