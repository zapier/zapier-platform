const perform = async (z, bundle) => {
  const response = await z.request({
    method: 'POST',
    url: 'https://auth-json-server.zapier-staging.com/recipes',
    body: {
      name: bundle.inputData.name,
    },
  });
  return response.data;
};

module.exports = {
  key: 'recipe',
  type: 'create',
  noun: 'Recipe',

  display: {
    label: 'Create Recipe',
    description: 'Creates a recipe.',
  },

  operation: {
    inputFields: [
      { key: 'name', required: true },
      { key: 'directions', required: false },
      { key: 'style', required: false },
    ],
    perform,

    sample: {
      id: 1,
      name: 'Test',
    },
  },
};
