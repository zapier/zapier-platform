const { setTimeout: sleep } = require('node:timers/promises');

const { callAPI } = require('../../../utils/api');

const MAX_RESULT_POLLING_ATTEMPTS = 30;

const ACTION_TYPE_MAP = {
  trigger: 'read',
  create: 'write',
  search: 'search',
};

const FIELD_TYPE_MAP = {
  password: 'password',
  unicode: 'string',
  text: 'text',
  int: 'integer',
  decimal: 'number',
  boolean: 'boolean',
  datetime: 'datetime',
  file: 'file',
  copy: 'copy',
  code: 'code',
};

const fetchInputFields = async (context) => {
  const actionType = ACTION_TYPE_MAP[context.actionType];
  const responseData = await callAPI(
    `/apps/${context.appId}/versions/${context.version}/needs`,
    {
      method: 'POST',
      body: {
        action_type: actionType,
        action_key: context.actionKey,
        authentication_id: context.authId,
        params: context.inputData,
      },
    },
  );
  return responseData.needs.map((need) => {
    return {
      key: need.key,
      type: FIELD_TYPE_MAP[need.type] || need.type,
      required: need.required,
      default: need.default,
      choices: need.choices,
      label: need.label,
      helpText: need.help_text,
      inputFormat: need.input_format,
      dynamic: need.prefill,
      list: need.list,
      placeholder: need.placeholder,
      alterDynamicFields: need.alter_dynamic_fields ?? false,
    };
  });
};

const fetchChoices = async (context, inputFieldKey) => {
  const actionType = ACTION_TYPE_MAP[context.actionType];
  const responseData = await callAPI(
    `/apps/${context.appId}/versions/${context.version}/choices`,
    {
      method: 'POST',
      body: {
        action_type: actionType,
        action_key: context.actionKey,
        authentication_id: context.authId,
        params: context.inputData,
        input_field_key: inputFieldKey,
      },
    },
  );
  return responseData.choices;  // TODO: rename the fields
};

const formatInvokeResults = (context, results) => {
  if (context.actionType === 'create') {
    if (Array.isArray(results)) {
      if (results.length === 0) {
        return {};
      } else {
        // Remote invoke API always wraps a single object result in an array.
        // Unwrap it here to make it behave like the local invoke.
        return results[0];
      }
    }
  }
  return results;
};

const pollForInvokeResult = async (context, invocationId) => {
  for (let i = 0; i < MAX_RESULT_POLLING_ATTEMPTS; i++) {
    const responseData = await callAPI(
      `/apps/${context.appId}/versions/${context.version}/invoke/${invocationId}`,
    );
    if (responseData.success) {
      switch (responseData.status) {
        case 'success':
          return formatInvokeResults(context, responseData.results);
        case 'error':
          throw new Error(responseData.errors.join('\n'));
        default:
          return responseData;
      }
    }
    await sleep(1000);
  }

  throw new Error(
    `Invocation timed out after ${MAX_RESULT_POLLING_ATTEMPTS} polling attempts.`,
  );
};

const remoteInvoke = async (context) => {
  const actionType = ACTION_TYPE_MAP[context.actionType];
  const responseData = await callAPI(
    `/apps/${context.appId}/versions/${context.version}/invoke`,
    {
      method: 'POST',
      body: {
        action_type: actionType,
        action_key: context.actionKey,
        authentication_id: context.authId,
        params: context.inputData,
      },
    },
  );
  return await pollForInvokeResult(context, responseData.invocation_id);
};

module.exports = {
  fetchChoices,
  fetchInputFields,
  remoteInvoke,
};
