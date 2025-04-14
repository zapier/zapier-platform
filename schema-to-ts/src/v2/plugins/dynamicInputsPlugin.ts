import { TopLevelPlugin, type TopLevelPluginContext } from '../types.ts';
import { docStringLines } from '../helpers.ts';
import type { JSONSchema4 } from 'json-schema';

/**
 * Patch the `DynamicInputs` type to use the real functional
 * `DynamicInputField` type from ./inputs.d.ts.
 */
export default class DynamicInputsPlugin extends TopLevelPlugin {
  test(ctx: TopLevelPluginContext): boolean {
    return ctx.schema.id === '/DynamicInputFieldsSchema';
  }

  render({ file, schema, schemasToRender }: TopLevelPluginContext) {
    file.addImportDeclaration({
      moduleSpecifier: './inputs',
      isTypeOnly: true,
      namedImports: ['DynamicInputField'],
    });

    file.addTypeAlias({
      name: 'DynamicInputFields',
      type: 'DynamicInputField[]',
      docs: docStringLines(schema.description),
      leadingTrivia: '\n',
    });

    if (schema.type !== 'array') {
      throw new Error('Expected DynamicInputFields to be an array');
    }

    this.checkReferencesInputFieldSchemaSchema(schema);

    // Still need to render the InputFieldSchema, add it to the queue to
    // include in the output.
    schemasToRender.push('/InputFieldSchema');
  }

  /**
   * Make sure we continue to reference the InputFieldSchema correctly.
   * Just a sanity check, for when/if we change the schema.
   */
  checkReferencesInputFieldSchemaSchema(schema: JSONSchema4) {
    if (
      !schema.items ||
      Array.isArray(schema.items) ||
      !('oneOf' in schema.items)
    ) {
      throw new Error('Expected DynamicInputFields items to be oneOf objects');
    }
    if (!schema.items.oneOf!.some((s) => s.$ref === '/InputFieldSchema')) {
      throw new Error(
        'Expected DynamicInputFields items to have InputFieldSchema',
      );
    }
  }
}
