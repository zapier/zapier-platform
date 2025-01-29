'use strict';

const makeSchema = require('../utils/makeSchema');
const FieldSchema = require('./FieldSchema');

module.exports = makeSchema(
  {
    ...FieldSchema.schema,
    id: '/AuthFieldSchema',
    description: 'Field schema specialized for authentication fields.',
    properties: {
      ...FieldSchema.schema.properties,
      isSafe: {
        description:
          'Indicates if this authentication field is safe (not secret).',
        type: 'boolean',
      },
    },

    // Add examples and anti-examples specifically for basic & custom auth
    examples: [
      // Basic Auth - email & password
      {
        key: 'email',
        type: 'string',
        isSafe: true,
        required: true,
      },
      {
        key: 'password',
        type: 'password',
        isSafe: false,
        required: true,
      },

      // Custom Auth - api key
      {
        key: 'api_key',
        type: 'string',
        isSafe: false,
        required: true,
      },
    ],

    antiExamples: [
      {
        example: {
          key: 'password',
          type: 'password',
          isSafe: true,
          required: true,
        },
        reason: 'A "password" field cannot have isSafe = true.',
      },
      {
        example: {
          key: 'api_key',
          isSafe: true,
        },
        reason:
          '"api_key" is a sensitive field and cannot have isSafe set as true.',
      },
      {
        example: {
          type: 'string',
          isSafe: false,
        },
        reason: 'Missing required key: key',
      },
    ],
  },

  [FieldSchema],
);
