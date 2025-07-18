import {
  defineInputFields,
  type CreatePerform,
  type InferInputData,
  type PollingTriggerPerform,
  type Resource,
  type SearchPerform,
} from 'zapier-platform-core';

// get a list of <%= LOWER_NOUN %>s
const performList = (async (z, bundle) => {
  const response = await z.request({
    url: 'https://jsonplaceholder.typicode.com/posts',
    params: {
      order_by: 'id desc',
      tag: bundle.inputData.tagName,
    },
  });
  return response.data;
}) satisfies PollingTriggerPerform;

const searchInputFields = defineInputFields([
  {
    key: 'name',
    required: true,
    helpText: 'Find the <%= NOUN %> with this name.',
  },
]);

// find a particular <%= LOWER_NOUN %> by name (or other search criteria)
const performSearch = (async (z, bundle) => {
  const response = await z.request({
    url: 'https://jsonplaceholder.typicode.com/posts',
    params: {
      name: bundle.inputData.name,
    },
  });
  return response.data;
}) satisfies SearchPerform<InferInputData<typeof searchInputFields>>;

const createInputFields = defineInputFields([
  { key: 'name', required: true },
  { key: 'fave_meal', label: 'Favorite Meal', required: false },
]);

// creates a new <%= LOWER_NOUN %>
const performCreate = (async (z, bundle) => {
  const response = await z.request({
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    body: {
      name: bundle.inputData.name, // json by default
    },
  });
  return response.data;
}) satisfies CreatePerform<InferInputData<typeof createInputFields>>;

export default {
  // see here for a full list of available properties:
  // https://github.com/zapier/zapier-platform/blob/main/packages/schema/docs/build/schema.md#resourceschema
  key: '<%= KEY %>',
  noun: '<%= NOUN %>',

  <%= INCLUDE_INTRO_COMMENTS ? [
    '// If `get` is defined, it will be called after a `search` or `create`'
  ].join('\n    ') : '' %>
  // useful if your `searches` and `creates` return sparse objects
  // get: {
  //   display: {
  //     label: 'Get <%= NOUN %>',
  //     description: 'Gets a <%= LOWER_NOUN %>.'
  //   },
  //   operation: {
  //     inputFields: [
  //       {key: 'id', required: true}
  //     ],
  //     perform: defineMe
  //   }
  // },

  list: {
    display: {
      label: 'New <%= NOUN %>',
      description: 'Lists the <%= LOWER_NOUN %>s.',
    },
    operation: {
      perform: performList,
      <%= INCLUDE_INTRO_COMMENTS ? [
        '// `inputFields` defines the fields a user could provide',
        '// Zapier will pass them in as `bundle.inputData` later. They\'re optional on triggers, but required on searches and creates.'
      ].join('\n      ') : '' %>
      inputFields: [],
    },
  },

  search: {
    display: {
      label: 'Find <%= NOUN %>',
      description: 'Finds a <%= LOWER_NOUN %> give.',
    },
    operation: {
      inputFields: searchInputFields,
      perform: performSearch,
    },
  },

  create: {
    display: {
      label: 'Create <%= NOUN %>',
      description: 'Creates a new <%= LOWER_NOUN %>.',
    },
    operation: {
      inputFields: createInputFields,
      perform: performCreate,
    },
  },

  <%= INCLUDE_INTRO_COMMENTS ? [
    '// In cases where Zapier needs to show an example record to the user, but we are unable to get a live example',
    '// from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of',
    '// returned records, and have obvious placeholder values that we can show to any user.',
    '// In this resource, the sample is reused across all methods'
  ].join('\n  ') : '' %>
  sample: {
    id: 1,
    name: 'Test',
  },

  <%= INCLUDE_INTRO_COMMENTS ? [
    '// If fields are custom to each user (like spreadsheet columns), `outputFields` can create human labels',
    '// For a more complete example of using dynamic fields see',
    '// https://github.com/zapier/zapier-platform/tree/main/packages/cli#customdynamic-fields',
    '// Alternatively, a static field definition can be provided, to specify labels for the fields',
    '// In this resource, these output fields are reused across all resources'
  ].join('\n  ') : '' %>
  outputFields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
  ],
} satisfies Resource;
