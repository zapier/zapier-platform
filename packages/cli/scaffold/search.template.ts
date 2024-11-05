import type { PerformFunction, Search } from 'zapier-platform-core';

// find a particular <%= LOWER_NOUN %> by name
const perform: PerformFunction = async (z, bundle) => {
  const response = await z.request({
    url: 'https://jsonplaceholder.typicode.com/posts',
    params: {
      name: bundle.inputData.name,
    },
  });
  // this should return an array of objects (but only the first will be used)
  return response.data;
};

export default {
  // see here for a full list of available properties:
  // https://github.com/zapier/zapier-platform/blob/main/packages/schema/docs/build/schema.md#searchschema
  key: '<%= KEY %>',
  noun: '<%= NOUN %>',

  display: {
    label: 'Find <%= NOUN %>',
    description: 'Finds a <%= LOWER_NOUN %> based on name.',
  },

  operation: {
    perform,

    <%= INCLUDE_INTRO_COMMENTS ? [
      '// `inputFields` defines the fields a user could provide',
      '// Zapier will pass them in as `bundle.inputData` later. Searches need at least one `inputField`.'
    ].join('\n    ') : '' %>
    inputFields: [
      {
        key: 'name',
        required: true,
        helpText: 'Find the <%= NOUN %> with this name.',
      },
    ],

    <%= INCLUDE_INTRO_COMMENTS ? [
    '// In cases where Zapier needs to show an example record to the user, but we are unable to get a live example',
    '// from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of',
    '// returned records, and have obvious placeholder values that we can show to any user.'
    ].join('\n    ') : '' %>
    sample: {
      id: 1,
      name: 'Test',
    },

    <%= INCLUDE_INTRO_COMMENTS ? [
      '// If fields are custom to each user (like spreadsheet columns), `outputFields` can create human labels',
      '// For a more complete example of using dynamic fields see',
      '// https://github.com/zapier/zapier-platform/tree/main/packages/cli#customdynamic-fields',
      '// Alternatively, a static field definition can be provided, to specify labels for the fields'
    ].join('\n    ') : '' %>
    outputFields: [
      // these are placeholders to match the example `perform` above
      // {key: 'id', label: 'Person ID'},
      // {key: 'name', label: 'Person Name'}
    ],
  },
} satisfies Search;
