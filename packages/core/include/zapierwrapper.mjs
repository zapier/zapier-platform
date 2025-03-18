// not intended to be loaded via require() or import() - copied during build step
import zapier from 'zapier-platform-core';

let appRaw;
try {
  appRaw = await import('{REPLACE_ME_PACKAGE_NAME}');
} catch (err) {
  if (err.code === 'ERR_MODULE_NOT_FOUND') {
    err.message +=
      '\nMake sure you specify a valid entry point using `exports` in package.json.';
  }
  throw err;
}

// Allows a developer to use named exports or default export in entry point
if (appRaw && appRaw.default) {
  appRaw = appRaw.default;
}

export const handler = zapier.createAppHandler(appRaw);
