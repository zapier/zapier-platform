import zapier from './src/index.js';
import packageJson from './package.json' with { type: 'json' };
import _tools from './src/tools/exported.js';
import _errors from './src/errors.js';
import { consoleProxy } from './src/tools/console-singleton.js';
zapier.version = packageJson.version;
zapier.tools = _tools;
zapier.errors = _errors;
zapier.console = consoleProxy;
// Allows `import { ... } from 'zapier-platform-core'`
export const {
  createAppHandler,
  createAppTester,
  defineApp,
  defineCreate,
  defineInputField,
  defineInputFields,
  defineSearch,
  defineTrigger,
  integrationTestHandler,
  console,
  tools,
  version,
  errors,
} = zapier;
// Allows `import zapier from 'zapier-platform-core'`
export default zapier;
