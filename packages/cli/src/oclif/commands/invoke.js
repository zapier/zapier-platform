const _ = require('lodash');
const { flags } = require('@oclif/command');
const debug = require('debug')('zapier:invoke');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const { localAppCommand } = require('../../utils/local');
const { startSpinner, endSpinner } = require('../../utils/display');

const ACTION_TYPE_PLURALS = {
  trigger: 'triggers',
  search: 'searches',
  create: 'creates',
};

const ACTION_TYPES = Object.keys(ACTION_TYPE_PLURALS);

const getMissingInputFields = (inputData, inputFields) => {
  return inputFields.filter(
    (f) => f.required && !f.default && !inputData[f.key]
  );
};

const resolveInputFieldTypes = (inputData, inputFields) => {
  const fieldsWithDefault = inputFields.filter((f) => f.default);
  for (const f of fieldsWithDefault) {
    if (!inputData[f.key]) {
      // TODO: Maybe not mutate inputData?
      inputData[f.key] = f.default;
    }
  }

  const inputFieldsByKey = _.keyBy(inputFields, 'key');
  for (const [k, v] of Object.entries(inputData)) {
    const inputField = inputFieldsByKey[k];
    if (!inputField) {
      continue;
    }

    switch (inputField.type) {
      // TODO: Maybe not mutate inputData?
      // TODO: Make sure each case is consistent with the backend
      case 'integer':
        inputData[k] = parseInt(v, 10);
        break;
      case 'number':
        inputData[k] = parseFloat(v);
        break;
      case 'boolean':
        inputData[k] = v === 'true' || v === 'yes' || v === '1';
        break;
      case 'datetime':
        if (v === 'now') {
          inputData[k] = new Date();
        }
        inputData[k] = new Date(v);
        break;
      case 'file':
        // TODO: How to handle a file field?
        break;
    }
  }

  // TODO: Handle line items (fields with "children")

  return inputData;
};

class InvokeCommand extends BaseCommand {
  async invokeAction(actionTypePlural, action, inputData) {
    // {actionType}.{actionKey}.operation.inputFields
    // {actionType}.{actionKey}.operation.perform
    //
    // if (search or hook) and hydrate-output:
    //   {actionType}.{actionKey}.operation.performGet
    // action.operation.inputFields;

    let methodName = `${actionTypePlural}.${action.key}.operation.inputFields`;
    startSpinner(`Invoking ${methodName}`);

    const inputFields = await localAppCommand({
      command: 'execute',
      method: methodName,
      bundle: {
        inputData,
      },
    });
    endSpinner();

    debug('inputFields:', inputFields);

    const missingFields = getMissingInputFields(inputData, inputFields);
    if (missingFields.length) {
      for (const f of missingFields) {
        const ftype = f.type || 'string';
        const value = await this.prompt(
          `Enter a value for input field "${f.key}" of type "${ftype}":`
        );
        inputData[f.key] = value;
      }
    }

    inputData = resolveInputFieldTypes(inputData, inputFields);
    methodName = `${actionTypePlural}.${action.key}.operation.perform`;

    startSpinner(`Invoking ${methodName}`);
    const output = await localAppCommand({
      command: 'execute',
      method: methodName,
      bundle: {
        inputData,
      },
    });
    endSpinner();

    console.log(JSON.stringify(output, null, 2));
  }

  async perform() {
    let { actionType, actionKey } = this.args;

    if (!actionType) {
      actionType = await this.promptWithList(
        'Which action type do you want to invoke?',
        ACTION_TYPES
      );
    }

    const actionTypePlural = ACTION_TYPE_PLURALS[actionType];

    // TODO: Don't hard-code 'index.js', respect the entry file defined in
    // package.json
    const appDefinition = await localAppCommand({
      command: 'definition',
    });
    // console.log(appDefinition);

    if (!actionKey) {
      const actionKeys = Object.keys(appDefinition[actionTypePlural] || {});
      if (!actionKeys.length) {
        throw new Error(`No "${actionTypePlural}" found in your integration.`);
      }

      actionKey = await this.promptWithList(
        `Which action key you want to invoke?`,
        actionKeys
      );
    }

    const action = appDefinition[actionTypePlural][actionKey];

    debug('Action type:', actionType);
    debug('Action key:', actionKey);
    debug('Action label:', action.display.label);

    let { inputData } = this.flags;
    if (inputData != null) {
      inputData = JSON.parse(inputData);
    }

    await this.invokeAction(actionTypePlural, action, inputData);
  }
}

InvokeCommand.flags = buildFlags({
  commandFlags: {
    inputData: flags.string({
      char: 'd',
      description:
        'The input data to pass to the action. Must be a JSON-encoded object.',
    }),
  },
});

InvokeCommand.args = [
  {
    name: 'actionType',
    description: 'The action type you want to invoke.',
    options: ACTION_TYPES,
  },
  {
    name: 'actionKey',
    description: 'The action key you want to invoke.',
  },
];

InvokeCommand.skipValidInstallCheck = true;
InvokeCommand.examples = [
  'zapier invoke trigger new_recipe',
  `zapier invoke create add_recipe --inputData '{"title": "Pancakes"}'`,
];
InvokeCommand.description = 'Invoke an action (trigger/search/create) locally.';

module.exports = InvokeCommand;
