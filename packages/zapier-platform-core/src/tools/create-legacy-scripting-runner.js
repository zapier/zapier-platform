'use strict';

const path = require('path');

const createLegacyScriptingRunner = (z, app) => {
  const source = app.legacyScriptingSource;
  if (!source) {
    return null;
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

  const scope = LegacyScriptingRunner.initScope();

  const Zap = new Function( // eslint-disable-line no-new-func
    '_',
    'crypto',
    'async',
    'moment',
    'DOMParser',
    'XMLSerializer',
    'atob',
    'btoa',
    'z',
    '$',
    'ErrorException',
    'HaltedException',
    'StopRequestException',
    'ExpiredAuthException',
    'RefreshTokenException',
    'InvalidSessionException',
    source + '\nreturn Zap;'
  )(
    scope._,
    scope.crypto,
    scope.async,
    scope.moment,
    scope.DOMParser,
    scope.XMLSerializer,
    scope.atob,
    scope.btoa,
    scope.z,
    scope.$,
    scope.ErrorException,
    scope.HaltedException,
    scope.StopRequestException,
    scope.ExpiredAuthException,
    scope.RefreshTokenException,
    scope.InvalidSessionException
  );

  return LegacyScriptingRunner(Zap, z, app);
};

module.exports = createLegacyScriptingRunner;
