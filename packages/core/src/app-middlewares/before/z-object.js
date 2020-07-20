'use strict';

const _ = require('lodash');

const createAppRequestClient = require('../../tools/create-app-request-client');
const createDehydrator = require('../../tools/create-dehydrator');
const createFileStasher = require('../../tools/create-file-stasher');
const createJSONtool = require('../../tools/create-json-tool');
const createStoreKeyTool = require('../../tools/create-storekey-tool');
const createCallbackHigherOrderFunction = require('../../tools/create-callback-wrapper');
const createLegacyScriptingRunner = require('../../tools/create-legacy-scripting-runner');
const createLoggerConsole = require('../../tools/create-logger-console');
const errors = require('../../errors');
const hashing = require('../../tools/hashing');

/*
   Before middleware that injects z object.
*/
const injectZObject = (input) => {
  const bundle = _.get(input, '_zapier.event.bundle', {});
  const zRoot = {
    console: createLoggerConsole(input),
    cursor: createStoreKeyTool(input),
    dehydrate: createDehydrator(input, 'method'),
    dehydrateFile: createDehydrator(input, 'file'),
    errors,
    generateCallbackUrl: createCallbackHigherOrderFunction(input),
    hash: hashing.hashify,
    JSON: createJSONtool(),
    require: (moduleName) => require(moduleName),
    stashFile: createFileStasher(input),
  };

  const zSkinny = _.extend({}, zRoot);

  const z = _.extend({}, zSkinny, {
    request: createAppRequestClient(input, { extraArgs: [zSkinny, bundle] }),
  });

  const runner = createLegacyScriptingRunner(z, input);
  if (runner) {
    z.legacyScripting = zSkinny.legacyScripting = runner;
  }

  return _.extend({}, input, { z });
};

module.exports = injectZObject;
