import zapier from './src/index.js';
import packageJson from './package.json' with { type: 'json' };
import _tools from './src/tools/exported.js';
import consoleSingleton from './src/tools/console-singleton.js';
zapier.version = packageJson.version;
zapier.tools = _tools;
zapier.console = consoleSingleton;
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
} = zapier;
// Allows `import zapier from 'zapier-platform-core'`
export default zapier;
