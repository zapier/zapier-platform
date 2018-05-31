'use strict';

const _ = require('lodash');

const createAppRequestClient = require('../../tools/create-app-request-client');
const createDehydrator = require('../../tools/create-dehydrator');
const createFileStasher = require('../../tools/create-file-stasher');
const createJSONtool = require('../../tools/create-json-tool');
const createStoreKeyTool = require('../../tools/create-storekey-tool');
const createLegacyScriptingRunner = require('../../tools/create-legacy-scripting-runner');
const createLoggerConsole = require('../../tools/create-logger-console');
const errors = require('../../errors');
const hashing = require('../../tools/hashing');

/*
   Before middleware that injects z object.
*/
const injectZObject = input => {
  const bundle = _.get(input, '_zapier.event.bundle', {});
  const zRoot = {
    console: createLoggerConsole(input),
    JSON: createJSONtool(),
    hash: hashing.hashify,
    dehydrate: createDehydrator(input),
    stashFile: createFileStasher(input),
    cursor: createStoreKeyTool(input),
    errors
  };

  let zSkinny = _.extend({}, zRoot);

  const z = _.extend({}, zSkinny, {
    request: createAppRequestClient(input, { extraArgs: [zSkinny, bundle] })
  });

  const app = _.get(input, '_zapier.app');
  const runner = createLegacyScriptingRunner(z, app);
  if (runner) {
    z.legacyScripting = runner;
  }

  return _.extend({}, input, { z });
};

module.exports = injectZObject;
