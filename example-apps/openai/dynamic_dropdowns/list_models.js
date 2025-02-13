const { API_URL } = require('../constants');

const perform = async (z, bundle) => {
  const response = await z.request({ url: `${API_URL}/models` });

  const responseData = response.data;

  return responseData.data.map((model) => ({
    id: model.id,
    name: model.id,
  }));
};

module.exports = {
  key: 'list_models',
  noun: 'Model',
  display: {
    label: 'List of Models',
    description: 'This is a hidden trigger, and is used in a Dynamic Dropdown of another trigger.',
    hidden: true,
  },
  operation: { perform },
};
