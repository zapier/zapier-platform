import {
  defineInputFields,
  defineCreate,
  type CreatePerform,
  type InferInputData,
} from 'zapier-platform-core';
import { API_URL } from '../constants.js';

const inputFields = defineInputFields([
  { key: 'title', required: true },
  { key: 'year', type: 'integer' },
]);

const perform = (async (z, bundle) => {
  const response = await z.request({
    method: 'POST',
    url: `${API_URL}/movies`,
    body: {
      title: bundle.inputData.title,
      year: bundle.inputData.year,
    },
  });
  return response.data;
}) satisfies CreatePerform<InferInputData<typeof inputFields>>;

export default defineCreate({
  key: 'movie',
  noun: 'Movie',

  display: {
    label: 'Create Movie',
    description: 'Creates a new movie.',
  },

  operation: {
    perform,
    inputFields,
    sample: {
      id: '1',
      title: 'example',
    },
  },
});
