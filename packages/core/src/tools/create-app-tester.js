'use strict';

const createLambdaHandler = require('./create-lambda-handler');
const resolveMethodPath = require('./resolve-method-path');
const ZapierPromise = require('./promise');
const { get } = require('lodash');
const { genId } = require('./data');

// this is (annoyingly) mirrored in cli/api_base, so that test functions only
// have a storeKey when canPaginate is true. otherwise, a test would work but a
// poll on site would fail. this is only used in test handlers

// there are 2 places you can put a method that can interact with cursors:
// triggers.contact.operation.perform, if it's a poll trigger
// resources.contact.list.operation.perform if it's a resource
// schema doesn't currently allow cursor use on hook trigger `performList`, so we don't need to account for it
const shouldPaginate = (appRaw, method) => {
  const methodParts = method.split('.');

  if (
    method.endsWith('perform') &&
    ((methodParts[0] === 'resources' && methodParts[2] === 'list') ||
      methodParts[0] === 'triggers')
  ) {
    methodParts.pop();
    return get(appRaw, [...methodParts, 'canPaginate']);
  }

  return false;
};

// Convert a app handler to promise for convenience.
const promisifyHandler = (handler) => {
  return (event) => {
    return new ZapierPromise((resolve, reject) => {
      handler(event, {}, (err, resp) => {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  };
};

// A shorthand compatible wrapper for testing.
const createAppTester = (appRaw, { customStoreKey } = {}) => {
  const handler = createLambdaHandler(appRaw);
  const createHandlerPromise = promisifyHandler(handler);

  const randomSeed = genId();

  return (methodOrFunc, bundle) => {
    bundle = bundle || {};

    const method = resolveMethodPath(appRaw, methodOrFunc);
    const storeKey = shouldPaginate(appRaw, method)
      ? customStoreKey
        ? `testKey-${customStoreKey}`
        : `testKey-${method}-${randomSeed}`
      : null;

    const event = {
      command: 'execute',
      method,
      bundle,
      storeKey,
    };

    if (process.env.LOG_TO_STDOUT) {
      event.logToStdout = true;
    }
    if (process.env.DETAILED_LOG_TO_STDOUT) {
      event.detailedLogToStdout = true;
    }

    return createHandlerPromise(event).then((resp) => resp.results);
  };
};

module.exports = createAppTester;
