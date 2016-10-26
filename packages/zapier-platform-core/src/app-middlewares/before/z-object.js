'use strict';

const _ = require('lodash');

const createAppRequestClient = require('../../tools/create-app-request-client');
const createJSONtool = require('../../tools/create-json-tool');
const createLoggerConsole = require('../../tools/create-logger-console');
const errors = require('../../errors');
const createDehydrator = require('../../tools/create-dehydrator');
const createFileStasher = require('../../tools/create-file-stasher');
const hashing = require('../../tools/hashing');

/*
   Before middleware that injects z object.
*/
const injectZObject = (input) => {
  const bundle = _.get(input, '_zapier.event.bundle', {});

  const zRoot = {
    console: createLoggerConsole(input),
    JSON: createJSONtool(),
    hash: hashing.hashify,
    dehydrate: createDehydrator(input),
    stashFile: createFileStasher(input),
    errors
  };

  let zSkinny = _.extend({}, zRoot);

  const z = _.extend({}, zSkinny, {
    request: createAppRequestClient(input, {extraArgs: [zSkinny, bundle]})
  });

  return _.extend({}, input, { z });
};

module.exports = injectZObject;
