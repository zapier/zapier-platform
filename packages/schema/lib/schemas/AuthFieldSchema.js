'use strict';

const makeSchema = require('../utils/makeSchema');
const FieldSchema = require('./FieldSchema');

module.exports = makeSchema(
  {
    ...FieldSchema.schema,
    id: '/AuthFieldSchema',
    description: 'Field schema specialized for auth input fields.',
    properties: {
      ...FieldSchema.schema.properties,
      isSafe: {
        description: 'Indicates if this auth input field is safe (not secret).',
        type: 'boolean',
      },
    },

    // Do not allow certain isSafe = True if sensitive tokens exists
    not: {
      properties: {
        key: {
          enum: [
            'access_token',
            'refresh_token',
            'api_key',
            'password',
            'secret',
          ],
        },
        isSafe: { const: true },
      },
      required: ['key', 'isSafe'],
    },
  },

  [FieldSchema],
);
