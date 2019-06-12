'use strict';

const path = require('path');

const _ = require('lodash');
const semver = require('semver');

const createLegacyScriptingRunner = (z, input) => {
  const app = _.get(input, '_zapier.app');

  let source =
    _.get(app, 'legacy.scriptingSource') || app.legacyScriptingSource;
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
  let LegacyScriptingRunner, version;
  try {
    LegacyScriptingRunner = require('zapier-platform-legacy-scripting-runner');
    version = require('zapier-platform-legacy-scripting-runner/package.json')
      .version;
  } catch (e) {
    // Find it in cwd, in case we're developing legacy-scripting-runner itself
    const cwd = process.cwd();
    try {
      const pkg = require(path.join(cwd, 'package.json'));
      if (pkg.name === 'zapier-platform-legacy-scripting-runner') {
        LegacyScriptingRunner = require(cwd);
        version = 'dev';
      }
    } catch (e2) {
      // Do nothing
    }
  }

  if (!LegacyScriptingRunner) {
    return null;
  }

  if (version === 'dev' || semver.gte(version, '3.0.0')) {
    return LegacyScriptingRunner(source, z, input);
  }
  return LegacyScriptingRunner(source, z, app);
};

module.exports = createLegacyScriptingRunner;
