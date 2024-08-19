import { Create, PerformFunction } from 'zapier-platform-core';

const perform: PerformFunction = async (z, bundle) => {
  const response = await z.request({
    method: 'POST',
    url: 'https://auth-json-server.zapier-staging.com/movies',
    body: {
      title: bundle.inputData.title,
      year: bundle.inputData.year,
    },
  });
  return response.data;
};

export default {
  key: 'movie',
  noun: 'Movie',

  display: {
    label: 'Create Movie',
    description: 'Creates a new movie.',
  },

  operation: {
    perform,
    inputFields: [
      { key: 'title', required: true },
      { key: 'year', type: 'integer' },
    ],
    sample: {
      id: '1',
      title: 'example',
    },
  },
} satisfies Create;
