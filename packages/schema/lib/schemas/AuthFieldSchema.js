'use strict';

const makeSchema = require('../utils/makeSchema');
const BaseFieldSchema = require('./BaseFieldSchema');
const schema = makeSchema(
  {
    id: '/AuthFieldSchema',
    description: 'Field schema specialized for auth fields (e.g., OAuth).',
    type: 'object',
    allOf: [
      { $ref: BaseFieldSchema.id },
      {
        type: 'object',
        properties: {
          // New property
          isSafe: {
            description: 'Indicates if this auth field is safe (not secret).',
            type: 'boolean',
          },
        },
        additionalProperties: false,
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
  [BaseFieldSchema],
);

schema.dependencies = [BaseFieldSchema];
module.exports = schema;
