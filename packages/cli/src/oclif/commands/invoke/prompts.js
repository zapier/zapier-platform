const _ = require('lodash');

const { listAuthentications } = require('../../../utils/api');
const { fetchChoices } = require('./remote');

/**
 * Formats a field definition for display in prompts.
 * @param {Object} field - The field definition
 * @param {string} field.key - The field key
 * @param {string} [field.label] - The field label
 * @param {string} [field.type] - The field type (defaults to 'string')
 * @param {boolean} [field.required] - Whether the field is required
 * @returns {string} Formatted string like "Label | key | type | required"
 */
const formatFieldDisplay = (field) => {
  const ftype = field.type || 'string';
  let result;
  if (field.label) {
    result = `${field.label} | ${field.key} | ${ftype}`;
  } else {
    result = `${field.key} | ${ftype}`;
  }
  if (field.required) {
    result += ' | required';
  }
  return result;
};

/**
 * Extracts a display label from an object for use in dynamic dropdowns.
 * Tries common label keys like 'name', 'title', 'display', etc.
 * @param {Object} obj - The object to extract a label from
 * @param {string} [preferredKey] - Preferred key to check first (supports nested paths with __)
 * @param {string} [fallbackKey] - Fallback key to check last (supports nested paths with __)
 * @returns {string} The extracted label or empty string if not found
 */
const getLabelForDynamicDropdown = (obj, preferredKey, fallbackKey) => {
  const keys = [
    'name',
    'Name',
    'display',
    'Display',
    'title',
    'Title',
    'subject',
    'Subject',
  ];
  if (preferredKey) {
    keys.unshift(preferredKey.split('__'));
  }
  if (fallbackKey) {
    keys.push(fallbackKey.split('__'));
  }
  for (const key of keys) {
    const label = _.get(obj, key);
    if (label) {
      return label;
    }
  }
  return '';
};

/**
 * Filters input fields to find required fields that are missing values.
 * @param {Object} inputData - The current input data
 * @param {Array<Object>} inputFields - Array of field definitions
 * @returns {Array<Object>} Array of required fields that have no value or default
 */
const getMissingRequiredInputFields = (inputData, inputFields) => {
  return inputFields.filter(
    (f) => f.required && !f.default && !inputData[f.key],
  );
};

/**
 * Fetches choices for a dynamic dropdown field.
 * @param {import('../../ZapierBaseCommand')} command - The command instance for prompting
 * @param {Object} context - The execution context
 * @param {Object} field - The field definition
 * @param {Function} invokeAction - Function to invoke actions (used for dynamic dropdowns)
 * @returns {Promise<Array<Object>>} Array of choices formatted as { name, value } objects
 */
const getDynamicDropdownChoices = async (
  command,
  context,
  field,
  invokeAction,
) => {
  if (context.remote) {
    return (await fetchChoices(context, field.key)).map((c) => ({
      name: `${c.label} (${c.value})`,
      value: c.value,
    }));
  } else {
    const [triggerKey, idField, labelField] = field.dynamic.split('.');
    const trigger = context.appDefinition.triggers[triggerKey];
    if (!trigger) {
      throw new Error(
        `Cannot find trigger "${triggerKey}" for dynamic dropdown of field "${field.key}".`,
      );
    }
    const newContext = {
      ...context,
      nonInteractive: true,
      actionType: 'trigger',
      actionKey: triggerKey,
      actionTypePlural: 'triggers',
      meta: {
        ...context.meta,
        isFillingDynamicDropdown: true,
      },
    };
    return (await invokeAction(command, newContext)).map((c) => {
      const id = c[idField] ?? 'null';
      const label = getLabelForDynamicDropdown(c, labelField, idField);
      return {
        name: `${label} (${id})`,
        value: id,
      };
    });
  }
};

/**
 * Normalizes static choices into an array of { name, value } objects for
 * prompting.
 * @param {Array|string|Object} choices - The static choices definition
 * @return {Array<Object>} Array of choices formatted as { name, value }
 */
const getStaticChoices = (choices) => {
  if (Array.isArray(choices)) {
    // Can be an array of string or an array of { value, label }
    if (choices.length === 0) {
      return [];
    } else if (typeof choices[0] === 'string') {
      return choices.map((x) => ({ name: `${x} (${x})`, value: x }));
    } else {
      return choices.map((c) => ({
        name: `${c.label} (${c.value})`,
        value: c.value,
      }));
    }
  } else {
    // If choices is not an array, then it must be an object of { value: label }
    return Object.entries(choices).map(([value, label]) => ({
      name: `${label} (${value})`,
      value,
    }));
  }
};

/**
 * Gets choices for a dropdown field, handling both static and dynamic cases.
 * @param {import('../../ZapierBaseCommand')} command - The command instance for prompting
 * @param {Object} context - The execution context
 * @param {Object} field - The field definition
 * @param {Function} invokeAction - Function to invoke actions (used for dynamic dropdowns)
 * @returns {Promise<Array<Object>>} Array of choices formatted as { name, value } objects
 */
const getStaticOrDynamicDropdownChoices = async (
  command,
  context,
  field,
  invokeAction,
) => {
  if (field.dynamic) {
    return await getDynamicDropdownChoices(
      command,
      context,
      field,
      invokeAction,
    );
  } else {
    return getStaticChoices(field.choices);
  }
};

/**
 * Prompts the user for a single field value.
 * Handles dynamic dropdowns, boolean fields, and regular text input.
 * @param {import('../../ZapierBaseCommand')} command - The command instance for prompting
 * @param {Object} context - The execution context
 * @param {Object} field - The field definition
 * @param {Function} invokeAction - Function to invoke actions (used for dynamic dropdowns)
 * @returns {Promise<string>} The user-provided value
 */
const promptForField = async (command, context, field, invokeAction) => {
  const message = formatFieldDisplay(field) + ':';
  if (field.dynamic || field.choices) {
    const choices = await getStaticOrDynamicDropdownChoices(
      command,
      context,
      field,
      invokeAction,
    );
    if (choices.length === 0) {
      // No choices available, fall back to text input
      return command.prompt(message, { useStderr: true });
    } else {
      return command.promptWithList(message, choices, { useStderr: true });
    }
  } else if (field.type === 'boolean') {
    const yes = await command.confirm(message, false, !field.required, true);
    return yes ? 'yes' : 'no';
  } else {
    return command.prompt(message, { useStderr: true });
  }
};

/**
 * Prompts for missing required fields or throws an error in non-interactive mode.
 * @param {import('../../ZapierBaseCommand')} command - The command instance for prompting
 * @param {Object} context - The execution context (inputData will be mutated)
 * @param {Array<Object>} inputFields - Array of field definitions
 * @param {Function} invokeAction - Function to invoke actions (used for dynamic dropdowns)
 * @returns {Promise<void>}
 * @throws {Error} If in non-interactive mode and required fields are missing
 */
const promptOrErrorForRequiredInputFields = async (
  command,
  context,
  inputFields,
  invokeAction,
) => {
  const missingFields = getMissingRequiredInputFields(
    context.inputData,
    inputFields,
  );
  if (missingFields.length) {
    if (context.nonInteractive || context.meta.isFillingDynamicDropdown) {
      throw new Error(
        "You're in non-interactive mode, so you must at least specify these required fields with --inputData: \n" +
          missingFields.map((f) => '* ' + formatFieldDisplay(f)).join('\n'),
      );
    }
    for (const f of missingFields) {
      context.inputData[f.key] = await promptForField(
        command,
        context,
        f,
        invokeAction,
      );
    }
  }
};

/**
 * Allows the user to interactively edit input field values.
 * Displays a list of fields and lets the user select which to edit.
 * @param {import('../../ZapierBaseCommand')} command - The command instance for prompting
 * @param {Object} context - The execution context (inputData will be mutated)
 * @param {Array<Object>} inputFields - Array of field definitions
 * @param {Function} invokeAction - Function to invoke actions (used for dynamic dropdowns)
 * @returns {Promise<void>}
 */
const promptForInputFieldEdit = async (
  command,
  context,
  inputFields,
  invokeAction,
) => {
  inputFields = inputFields.filter((f) => f.key);
  if (!inputFields.length) {
    return;
  }

  // Let user select which field to fill/edit
  while (true) {
    let fieldChoices = inputFields.map((f) => {
      let name;
      if (f.label) {
        name = `${f.label} (${f.key})`;
      } else {
        name = f.key;
      }
      if (context.inputData[f.key]) {
        name += ` [current: "${context.inputData[f.key]}"]`;
      } else if (f.default) {
        name += ` [default: "${f.default}"]`;
      }
      return {
        name,
        value: f.key,
      };
    });
    fieldChoices = [
      {
        name: '>>> DONE <<<',
        short: 'DONE',
        value: null,
      },
      ...fieldChoices,
    ];
    const fieldKey = await command.promptWithList(
      'Would you like to edit any of these input fields? Select "DONE" when you are all set.',
      fieldChoices,
      { useStderr: true },
    );
    if (!fieldKey) {
      break;
    }

    const field = inputFields.find((f) => f.key === fieldKey);
    context.inputData[fieldKey] = await promptForField(
      command,
      context,
      field,
      invokeAction,
    );
  }
};

/**
 * Main entry point for field prompting. Handles required fields and optional editing.
 * @param {import('../../ZapierBaseCommand')} command - The command instance for prompting
 * @param {Object} context - The execution context (inputData will be mutated)
 * @param {Array<Object>} inputFields - Array of field definitions
 * @param {Function} invokeAction - Function to invoke actions (used for dynamic dropdowns)
 * @returns {Promise<void>}
 */
const promptForFields = async (command, context, inputFields, invokeAction) => {
  await promptOrErrorForRequiredInputFields(
    command,
    context,
    inputFields,
    invokeAction,
  );
  if (!context.nonInteractive && !context.meta.isFillingDynamicDropdown) {
    await promptForInputFieldEdit(command, context, inputFields, invokeAction);
  }
};

/**
 * Prompts the user to select an authentication/connection from their available authentications.
 * @param {import('../../ZapierBaseCommand')} command - The command instance for prompting
 * @returns {Promise<number>} The selected authentication ID
 * @throws {Error} If no authentications are found for the integration
 */
const promptForAuthentication = async (command) => {
  const auths = (await listAuthentications()).authentications;
  if (!auths || auths.length === 0) {
    throw new Error(
      'No authentications/connections found for your integration. ' +
        'Add a new connection at https://zapier.com/app/assets/connections ' +
        'or use local auth data by removing the `--authentication-id` flag.',
    );
  }
  const authChoices = auths.map((auth) => ({
    name: `${auth.title} | ${auth.app_version} | ID: ${auth.id}`,
    value: auth.id,
  }));
  return command.promptWithList(
    'Which authentication/connection would you like to use?',
    authChoices,
    { useStderr: true },
  );
};

module.exports = {
  formatFieldDisplay,
  getLabelForDynamicDropdown,
  getMissingRequiredInputFields,
  promptForAuthentication,
  promptForField,
  promptOrErrorForRequiredInputFields,
  promptForInputFieldEdit,
  promptForFields,
};
