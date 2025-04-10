import { TopLevelPlugin, type TopLevelPluginContext } from '../types.ts';
import { docStringLines } from '../helpers.ts';

/**
 * Patch in the `PerformFunction` type, replacing the schema-specific
 * serialised formats the platform uses.
 */
export default class PerformFunctionPlugin extends TopLevelPlugin {
  test(ctx: TopLevelPluginContext): boolean {
    return ctx.schema.id === '/FunctionSchema';
  }

  render(ctx: TopLevelPluginContext) {
    ctx.file.addTypeAlias({
      name: 'Function',
      type: 'PerformFunction',
      docs: docStringLines(ctx.schema.description),
    });
  }
}
