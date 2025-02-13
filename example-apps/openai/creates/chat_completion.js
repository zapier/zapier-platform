const { API_URL, DEFAULT_MODEL } = require('../constants');

const sample = require('../samples/chat.json');

async function getAdvancedFields(_z, bundle) {
  if (bundle.inputData.show_advanced === true) {
    return [
      {
        key: 'info_advanced',
        type: 'copy',
        helpText:
          "The following fields are for advanced users and should be used with caution as they may affect performance. In most cases, the default options are sufficient. If you'd like to explore these options further, you can [learn more here](https://help.zapier.com/hc/en-us/articles/22497191078797).",
      },
      {
        key: 'developer_message',
        label: 'Developer/System Message',
        type: 'text',
        helpText:
          'Instructions to the model that are prioritized ahead of user messages, following [chain of command](https://cdn.openai.com/spec/model-spec-2024-05-08.html#follow-the-chain-of-command).',
      },
      {
        key: 'temperature',
        label: 'Temperature',
        type: 'number',
        helpText:
          'Higher values mean the model will take more risks. Try 0.9 for more creative applications, and 0 for ones with a well-defined answer.\n\nUse a decimal between 0 and 1.',
        },
        {
          key: 'max_completion_tokens',
          label: 'Maximum Length',
          type: 'integer',
          helpText: 'The maximum number of tokens for the completion.',
        },
    ];  
  }
  return [];
}

async function perform(z, bundle) {
  const { user_message, model, files, developer_message, temperature, max_completion_tokens } = bundle.inputData;

  const developerMessage = {
    role: 'developer',
    content: [
      {
        type: 'text',
        text: developer_message || 'You are a helpful assistant.',
      },
    ],
  };

  const userMessage = {
    role: 'user',
    content: [
      {
        type: 'text',
        text: user_message,
      },
      ...(files ? files.map((file) => ({
        type: 'image_url',
        image_url: {
          url: file,
        },
      })) : []),
    ],
  };

  const messages = [developerMessage, userMessage];

    const response = await z.request({
      url: `${API_URL}/chat/completions`,
      method: 'POST',
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_completion_tokens,
      }),
    });
    return response.data;
};

module.exports = {
  key: 'chat_completion',
  noun: 'Chat',
  display: {
    label: 'Chat Completion',
    description: 'Sends a Chat to OpenAI and generates a Completion.',
  },
  operation: {
    perform,
    inputFields: [
      {
        key: 'info_data_usage',
        type: 'copy',
        helpText:
          "Data sent to OpenAI through this Zap is via an API. Under OpenAI's [API data usage policy](https://openai.com/policies/api-data-usage-policies), OpenAI will not use API-submitted data to train or improve their models unless you explicitly decide to share your data with them for that purpose (such as by opting in). For more information, please review OpenAI's article about [when/how data may be used to improve model performance](https://help.openai.com/en/articles/5722486-how-your-data-is-used-to-improve-model-performance).",
      },
      {
        key: 'user_message',
        label: 'User Message',
        type: 'text',
        helpText: 'Instructions that request some output from the model. Similar to messages you\'d type in [ChatGPT](https://chatgpt.com) as an end user.',
        required: true,
      },
      {
        key: 'files',
        label: 'Images',
        type: 'file',
        helpText: 'Images to include along with your message.',
        list: true,
      },
      {
        key: 'model',
        label: 'Model',
        type: 'string',
        required: true,
        default: DEFAULT_MODEL, // Optional to default to a specific model for most users
        dynamic: 'list_models.id.name',
        altersDynamicFields: false,
      },
      {
        key: 'show_advanced',
        label: 'Show Advanced Options',
        type: 'boolean',
        default: 'false',
        altersDynamicFields: true,
      },
      getAdvancedFields,
    ],
    // Rename some of the output fields to be more descriptive for a user
    outputFields: [
      { key: 'id', type: 'string', label: 'Completion ID' },
      { key: 'model', type: 'string', label: 'Model' },
      { key: 'usage__prompt_tokens', type: 'number', label: 'Usage: Prompt Tokens' },
      { key: 'usage__completion_tokens', type: 'number', label: 'Usage: Completion Tokens' },
      { key: 'usage__total_tokens', type: 'number', label: 'Usage: Total Tokens' },
    ],
    sample,
  },
};
