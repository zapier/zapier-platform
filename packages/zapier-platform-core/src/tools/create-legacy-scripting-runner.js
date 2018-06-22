'use strict';

const path = require('path');

const createLegacyScriptingRunner = (z, app) => {
  let source = app.legacyScriptingSource;
  if (source === undefined) {
    // Don't initialize z.legacyScripting for a pure CLI app
    return null;
  }

  if (!source) {
    // Even if the app has no scripting, we still rely on legacy-scripting-runner
    // to run some scriptingless operations
    source = 'var Zap = {};';
  }

  // Only UI-built app will have this legacy-scripting-runner dependency, so we
  // need to make it an optional dependency
  let LegacyScriptingRunner = null;
  try {
    LegacyScriptingRunner = require('zapier-platform-legacy-scripting-runner');
  } catch (e) {
    // Find it in cwd, in case we're developing legacy-scripting-runner itself
    const cwd = process.cwd();
    try {
      const pkg = require(path.join(cwd, 'package.json'));
      if (pkg.name === 'zapier-platform-legacy-scripting-runner') {
        LegacyScriptingRunner = require(cwd);
      }
    } catch (e2) {
      // Do nothing
    }
  }

  if (!LegacyScriptingRunner) {
    return null;
  }
  return LegacyScriptingRunner(source, z, app);
};

module.exports = createLegacyScriptingRunner;
