'use strict';

const _ = require('lodash');

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
    return null;
  }

  const { DOMParser, XMLSerializer } = require('xmldom');
  const {
    ErrorException,
    HaltedException,
    StopRequestException,
    ExpiredAuthException,
    RefreshTokenException,
    InvalidSessionException
  } = require('zapier-platform-legacy-scripting-runner/exceptions');

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
    _,
    require('crypto'),
    require('async'),
    require('moment-timezone'),
    DOMParser,
    XMLSerializer,
    require('zapier-platform-legacy-scripting-runner/atob'),
    require('zapier-platform-legacy-scripting-runner/btoa'),
    require('zapier-platform-legacy-scripting-runner/z'),
    require('zapier-platform-legacy-scripting-runner/$'),
    ErrorException,
    HaltedException,
    StopRequestException,
    ExpiredAuthException,
    RefreshTokenException,
    InvalidSessionException
  );

  return LegacyScriptingRunner(Zap, z, app);
};

module.exports = createLegacyScriptingRunner;
