import { BulkBundle, ZObject } from 'zapier-platform-core';

// You can optionally add the shape of the inputData in bundle, which will pass that
// info down into the function and tests
const performBulk = async (
  z: ZObject,
  bundle: BulkBundle<{ genre: string; title: string; year: number }>
) => {
  // Flatten the line items, preserving order
  const movies = bundle.bulk.forEach(({inputData}) => {
    return {title: inputData.title, year: inputData.year};
  });

  const response = await z.request({
    method: 'POST',
    url: 'https://auth-json-server.zapier-staging.com/movies',
    body: {
      genre: bundle.groupedBy.genre,
      movies,
    },
  });

  // Create a matching result using the idempotency ID for each buffered bundle
  // The returned IDs will tell Zapier backend which items were successfully written.
  const result: {[id: string]: any} = {};
  bundle.bulk.forEach(({inputData, meta}, index) => {
    let error;
    let outputData;

    // assuming request order matches response
    if (response.data.length > index) {
      if (response.data[index].error) {
        error = response.data[index].error;
      } else {
        outputData = response.data[index];
      }
    }

    result[meta.id] = { outputData, error };
  });
};

export default {
  key: 'movies',
  noun: 'Movies',

  display: {
    label: 'Create Movies',
    description: 'Creates new movies in bulk.',
  },

  operation: {
    bulk: {
      groupedBy: ['genre'],
      limit: 5,
    },
    performBulk,
    inputFields: [
      { key: 'genre', type: 'string', required: true },
      { key: 'title', type: 'string' },
      { key: 'year', type: 'integer' },
    ],
    sample: {
      id: '1',
      title: 'example',
      genre: 'example genre',
      year: 2024,
    },
  },
};
