const zapier = require('./src');
zapier.version = require('./package.json').version;
zapier.tools = require('./src/tools/exported');
zapier.errors = require('./src/errors');

// Export individual error classes for compatibility with ES modules
const {
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
  Error: AppError,
} = zapier.errors;

// Add individual error classes to main export for named destructuring
Object.assign(zapier, {
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
  AppError,
});

module.exports = zapier;
