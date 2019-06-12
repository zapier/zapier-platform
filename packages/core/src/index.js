'use strict';

const createLambdaHandler = require('./tools/create-lambda-handler');
const createAppTester = require('./tools/create-app-tester');

let _integrationTestHandler;
const integrationTestHandler = (event, context, callback) => {
  const testAppPath = require.resolve('../test/userapp');
  _integrationTestHandler =
    _integrationTestHandler || createLambdaHandler(testAppPath);
  return _integrationTestHandler(event, context, callback);
};

module.exports = {
  createAppHandler: createLambdaHandler,
  createAppTester: createAppTester,
  integrationTestHandler
};
