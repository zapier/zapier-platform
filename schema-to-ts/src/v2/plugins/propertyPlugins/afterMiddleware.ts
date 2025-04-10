import { PropertyPlugin, type PropertyPluginContext } from '../base.ts';
import { docStringLines } from '../../helpers.ts';

export default class AfterMiddlewarePlugin extends PropertyPlugin {
  test({ interfaceName, key }: PropertyPluginContext): boolean {
    return interfaceName === 'App' && key === 'afterResponse';
  }

  compile({ iface, key, value, required }: PropertyPluginContext) {
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
