import createClient from 'openapi-fetch';

const client = createClient({ baseUrl: 'https://httpbin.zapier-tooling.com' });

const perform = async (z, bundle) => {
  const response1 = await z.request('https://httpbin.zapier-tooling.com/get');
  const data1 = await response1.json();
  data1.id = 1; // just to pass the check

  const response2 = await client.GET('/json');
  const data2 = response2.data;
  data2.id = 2;

  return [data1, data2];
};

export default {
  key: 'recipe',
  noun: 'Recipe',
  display: {
    label: 'New Recipe',
    description: 'Triggers when a new recipe is created.',
  },
  operation: {
    perform,
    inputFields: [],
    sample: {
      id: 1,
    },
  },
};
