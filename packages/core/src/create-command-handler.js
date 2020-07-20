'use strict';

const schemaTools = require('./tools/schema');

const execute = require('./execute');
const executeRequest = require('./execute-request');
const { handleError } = require('./errors');

const commandHandlers = {
  execute,
  validate: schemaTools.validateApp,
  definition: schemaTools.serializeApp,
  request: (app, input) => executeRequest(input),
};

/*
  Creates middleware app that can process z-app app definitions, handling
  commands like 'execute', 'validate', 'definition', 'request'.
*/
const createCommandHandler = (compiledApp) => {
  return (input) => {
    const command = input._zapier.event.command || 'execute'; // validate || definition || request
    const handler = commandHandlers[command];
    if (!handler) {
      throw new Error(`Unexpected command ${command}`);
    }

    try {
      return handler(compiledApp, input);
    } catch (err) {
      return handleError(err);
    }
  };
};

module.exports = createCommandHandler;
