import zapier from './src/index.js';
import packageJson from './package.json' with { type: 'json' };
import _tools from './src/tools/exported.js';
import _errors from './src/errors.js';
zapier.version = packageJson.version;
zapier.tools = _tools;
zapier.errors = _errors;
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
  tools,
  version,
  errors,
} = zapier;

// Export individual error classes for direct import
export const {
  CheckError,
  DehydrateError,
  ExpiredAuthError,
  HaltedError,
  MethodDoesNotExist,
  NotImplementedError,
  RefreshAuthError,
  RequireModuleError,
  StashedBundleError,
  StopRequestError,
  ResponseError,
  ThrottledError,
} = _errors;
// Export Error with alias to avoid conflict with global Error
export const AppError = _errors.Error;
// Allows `import zapier from 'zapier-platform-core'`
export default zapier;
