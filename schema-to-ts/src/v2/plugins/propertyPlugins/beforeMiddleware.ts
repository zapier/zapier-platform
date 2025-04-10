import { PropertyPlugin, type PropertyPluginContext } from '../base.ts';
import { docStringLines } from '../../helpers.ts';

/**
 * Injects the correct types for the `beforeRequest` property, custom functions.
 */
export default class BeforeMiddlewarePlugin extends PropertyPlugin {
  test({ interfaceName, key }: PropertyPluginContext): boolean {
    return interfaceName === 'App' && key === 'beforeRequest';
  }

  compile({ iface, key, value, required }: PropertyPluginContext) {
    // TODO: Move Middleware plugin types to the Functions module.
    iface.addProperty({
      name: key,
      type: 'BeforeRequestMiddleware | BeforeRequestMiddleware[]',
      docs: docStringLines(value.description),
      leadingTrivia: '\n',
      hasQuestionToken: !required,
    });
  }
}
