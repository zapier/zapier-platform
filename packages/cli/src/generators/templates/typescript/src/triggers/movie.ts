import { PerformFunction, Trigger } from 'zapier-platform-core';

const perform: PerformFunction = async (z, bundle) => {
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
    type: 'polling',
    perform,
    sample: {
      id: '1',
      title: 'example',
    },
  },
} satisfies Trigger;
