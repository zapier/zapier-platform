'use strict';

const makeSchema = require('../utils/makeSchema');
const FieldSchema = require('./FieldSchema');

const schema = makeSchema(
  {
    id: '/AuthInputFieldSchema',
    description:
      'Field schema specialized for auth input fields (e.g., OAuth).',
    type: 'object',
    allOf: [
      { $ref: FieldSchema.id },
      {
        type: 'object',
        properties: {
          // New property
          isSafe: {
            description:
              'Indicates if this auth input field is safe (not secret).',
            type: 'boolean',
          },
        },
      },
      // Forbid certain keys from having isSafe = true
      {
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
    ],
  },
  [FieldSchema],
);

module.exports = schema;
