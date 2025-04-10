import { PropertyPlugin, type PropertyPluginContext } from '../../types.ts';
import { docStringLines } from '../../helpers.ts';

/**
 * Injects the correct types for the `afterResponse` middleware function
 * of the App Type.
 */
export default class AfterMiddlewarePPlugin extends PropertyPlugin {
  test({ interfaceName, key }: PropertyPluginContext): boolean {
    return interfaceName === 'App' && key === 'afterResponse';
  }

  render({ iface, key, value, required }: PropertyPluginContext) {
    // TODO: Move Middleware plugin types to the Functions module.
    iface.addProperty({
      name: key,
      type: 'AfterResponseMiddleware | AfterResponseMiddleware[]',
      docs: docStringLines(value.description),
      leadingTrivia: '\n',
      hasQuestionToken: !required,
    });
  }
}
