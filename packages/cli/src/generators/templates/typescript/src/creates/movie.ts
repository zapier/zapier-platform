import { Bundle, ZObject } from 'zapier-platform-core';

// You can optionally add add the shape of the inputData in bundle, which will pass that
// info down into the function and tests
const perform = async (
  z: ZObject,
  bundle: Bundle<{ title: string; year: number }>
) => {
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
};
