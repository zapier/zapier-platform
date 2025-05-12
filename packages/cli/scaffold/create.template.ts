import {
  defineInputFields,
  defineCreate,
  type CreatePerform,
  type InferInputData,
} from 'zapier-platform-core';

const inputFields = defineInputFields([
  { key: 'name', required: true },
  { key: 'fave_meal', label: 'Favorite Meal', required: false },
]);

// create a particular <%= LOWER_NOUN %> by name
const perform = (async (z, bundle) => {
  const response = await z.request({
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    // if `body` is an object, it'll automatically get run through JSON.stringify
    // if you don't want to send JSON, pass a string in your chosen format here instead
    body: {
      name: bundle.inputData.name,
    },
  });
  // this should return a single object
  return response.data;
}) satisfies CreatePerform<InferInputData<typeof inputFields>>;

export default defineCreate({
  // see here for a full list of available properties:
  // https://github.com/zapier/zapier-platform/blob/main/packages/schema/docs/build/schema.md#createschema
  key: '<%= KEY %>',
  noun: '<%= NOUN %>',

  display: {
    label: 'Create <%= NOUN %>',
    description: 'Creates a new <%= LOWER_NOUN %>, probably with input from previous steps.'
  },

  operation: {
    perform,

    <%= INCLUDE_INTRO_COMMENTS ? [
      '// `inputFields` defines the fields a user could provide',
      '// Zapier will pass them in as `bundle.inputData` later. They\'re optional.',
      '// End-users will map data into these fields. In general, they should have any fields that the API can accept. Be sure to accurately mark which fields are required!'
    ].join('\n    ') : '' %>
    inputFields,

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
});
