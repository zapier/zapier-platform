const perform = async (z, bundle) => {
  const response = await z.request({
    url: 'https://auth-json-server.zapier-staging.com/recipes',
    params: {
      name: bundle.inputData.name,
    },
  });
  return response.data;
};

module.exports = {
  key: 'recipe',
  type: 'search',
  noun: 'Recipe',

  display: {
    label: 'Find Recipe',
    description: 'Finds a recipe.',
  },

  operation: {
    inputFields: [
      {
        key: 'name',
        required: true,
        helpText: 'Find the Recipe with this name.',
      },
    ],
    perform,

    sample: {
      id: 1,
      name: 'Test',
    },
  },
};
