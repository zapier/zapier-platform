const debug = require('debug')('zapier:invoke');

const { startSpinner, endSpinner } = require('../../../utils/display');
const { customLogger } = require('./logger');
const { localAppCommandWithRelayErrorHandler } = require('./relay');
const { promptForFields } = require('./prompts');
const resolveInputDataTypes = require('./input-types');

/**
 * Invokes a trigger, create, or search action locally.
 * Handles the full flow: prompting for input fields, resolving types, and executing the perform method.
 * @param {import('../../ZapierBaseCommand')} command - The command instance for prompting
 * @param {Object} context - The execution context containing app definition, auth data, input data, etc.
 * @returns {Promise<*>} The action output
 */
const invokeAction = async (command, context) => {
  // Do these in order:
  // 1. Prompt for static input fields that alter dynamic fields
  // 2. {actionTypePlural}.{actionKey}.operation.inputFields
  // 3. Prompt for input fields again
  // 4. {actionTypePlural}.{actionKey}.operation.perform
  const action =
    context.appDefinition[context.actionTypePlural][context.actionKey];
  const staticInputFields = (action.operation.inputFields || []).filter(
    (f) => f.key,
  );
  debug('staticInputFields:', staticInputFields);

  await promptForFields(command, context, staticInputFields, invokeAction);

  let methodName = `${context.actionTypePlural}.${action.key}.operation.inputFields`;
  startSpinner(`Invoking ${methodName}`);

  const inputFields = await localAppCommandWithRelayErrorHandler({
    command: 'execute',
    method: methodName,
    bundle: {
      inputData: context.inputData,
      inputDataRaw: context.inputData, // At this point, inputData hasn't been transformed yet
      authData: context.authData,
      meta: context.meta,
    },
    zcacheTestObj: context.zcacheTestObj,
    cursorTestObj: context.cursorTestObj,
    customLogger,
    calledFromCliInvoke: true,
    appId: context.appId,
    deployKey: context.deployKey,
    relayAuthenticationId: context.authId,
  });
  endSpinner();

  debug('inputFields:', inputFields);

  if (inputFields.length !== staticInputFields.length) {
    await promptForFields(command, context, inputFields, invokeAction);
  }

  // Preserve original inputData as inputDataRaw before type resolution
  const inputDataRaw = { ...context.inputData };
  const inputData = resolveInputDataTypes(
    context.inputData,
    inputFields,
    context.timezone,
  );
  methodName = `${context.actionTypePlural}.${action.key}.operation.perform`;

  startSpinner(`Invoking ${methodName}`);
  const output = await localAppCommandWithRelayErrorHandler({
    command: 'execute',
    method: methodName,
    bundle: {
      inputData,
      inputDataRaw,
      authData: context.authData,
      meta: context.meta,
    },
    zcacheTestObj: context.zcacheTestObj,
    cursorTestObj: context.cursorTestObj,
    customLogger,
    calledFromCliInvoke: true,
    appId: context.appId,
    deployKey: context.deployKey,
    relayAuthenticationId: context.authId,
  });
  endSpinner();

  return output;
};

module.exports = { invokeAction };
