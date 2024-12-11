'use strict';

const { SKIP_KEY } = require('../constants');
const makeSchema = require('../utils/makeSchema');
const ResourceSchema = require('./ResourceSchema');

module.exports = makeSchema(
  {
    id: '/ResourcesSchema',
    description:
      'All the resources that underlie common CRUD methods powering automatically handled triggers, creates, and searches for your app. Zapier will break these apart for you.',
    type: 'object',
    patternProperties: {
      '^[a-zA-Z]+[a-zA-Z0-9_]*$': {
        description:
          'Any unique key can be used and its values will be validated against the ResourceSchema.',
        $ref: ResourceSchema.id,
      },
    },
    additionalProperties: false,
    examples: [
      {
        tag: {
          key: 'tag',
          noun: 'Tag',
          get: {
            display: {
              label: 'Get Tag by ID',
              description: 'Grab a specific Tag by ID.',
            },
            operation: {
              perform: {
                url: 'https://fake-crm.getsandbox.com/tags/{{inputData.id}}',
              },
              sample: {
                id: 385,
                name: 'proactive enable ROI',
              },
            },
          },
        },
      },
    ],
    antiExamples: [
      {
        [SKIP_KEY]: true, // Cannot validate that keys don't match
        example: {
          getTag: {
            key: 'tag',
            noun: 'Tag',
            get: {
              display: {
                label: 'Get Tag by ID',
                description: 'Grab a specific Tag by ID.',
              },
              operation: {
                perform: {
                  url: 'https://fake-crm.getsandbox.com/tags/{{inputData.id}}',
                },
                sample: {
                  id: 385,
                  name: 'proactive enable ROI',
                },
              },
            },
          },
        },
        reason: 'Key does not match key for associated /ResourceSchema',
      },
      {
        [SKIP_KEY]: true, // Cannot validate that sample is only required if display isn't true / top-level resource doesn't have sample
        example: {
          tag: {
            key: 'tag',
            noun: 'Tag',
            get: {
              display: {
                label: 'Get Tag by ID',
                description: 'Grab a specific Tag by ID.',
              },
              operation: {
                perform: {
                  url: 'https://fake-crm.getsandbox.com/tags/{{inputData.id}}',
                },
              },
            },
          },
        },
        reason:
          'Missing key from operation: sample. Note – this is valid if the resource has defined a sample.',
      },
    ],
  },
  [ResourceSchema],
);
