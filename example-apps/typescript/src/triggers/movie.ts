import { Bundle, ZObject } from 'zapier-platform-core';

const perform = async (z: ZObject, bundle: Bundle) => {
  const response = await z.request(
    'https://auth-json-server.zapier-staging.com/movies'
  );
  return response.data;
};

export default {
  key: 'movie',
  noun: 'Movie',

  display: {
    label: 'New Movie',
    description: 'Triggers when a new movie is created.',
  },

  operation: {
    perform,
    sample: {
      id: '1',
      title: 'example',
    },
  },
};
