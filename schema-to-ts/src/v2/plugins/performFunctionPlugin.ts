import { TopLevelPlugin, type TopLevelPluginContext } from '../types.ts';
import { docStringLines } from '../helpers.ts';

/**
 * Patch in the `PerformFunction` type, replacing the schema-specific
 * serialised formats the platform uses. Also add a deprecation comment.
 */
export default class PerformFunctionPlugin extends TopLevelPlugin {
  test(ctx: TopLevelPluginContext): boolean {
    return ctx.schema.id === '/FunctionSchema';
  }

  render(ctx: TopLevelPluginContext) {
    const originalDocs = docStringLines(ctx.schema.description);
    const docs = originalDocs
      ? [
          originalDocs[0] +
            '\n\n@deprecated - Prefer using the perform types from the `functions` module.',
        ]
      : undefined;

    ctx.file.addTypeAlias({
      name: 'Function',
      type: 'PerformFunction',
      docs,
    });
  }
}
