import { defineTrigger, PollingTriggerPerform } from 'zapier-platform-core';
import { API_URL } from '../constants.js';

const perform = (async (z, bundle) => {
  const response = await z.request(`${API_URL}/movies`);
  return response.data;
}) satisfies PollingTriggerPerform;

export default defineTrigger({
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
});
