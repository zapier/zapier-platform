'use strict';

const makeSchema = require('../utils/makeSchema');
const FieldChoicesSchema = require('./FieldChoicesSchema');
const FieldSchema = require('./FieldSchema');

module.exports = makeSchema(
  {
    id: '/AuthOutputFieldSchema',
    description: `Field schema specialized for authentication output fields. ${FieldSchema.schema.description}`,
    required: ['key'],
    type: 'object',
    properties: {
      ...FieldSchema.schema.properties,
      children: {
        type: 'array',
        items: { $ref: '/AuthOutputFieldSchema' },
        description:
          'An array of child fields that define the structure of a sub-object for this field. Usually used for line items.',
        minItems: 1,
      },
      type: {
        description: 'The type of this value used to be.',
        type: 'string',
        enum: ['string', 'number', 'boolean', 'datetime', 'password'],
      },
      required: {
        description:
          'If this value is required or not. This defaults to `true`.',
        type: 'boolean',
      },
      isNoSecret: {
        description:
          'Indicates if this authentication field is safe to e.g. be stored without encryption or displayed (not a secret).',
        type: 'boolean',
      },
    },

    // Add examples and anti-examples specifically for basic & custom auth
    examples: [
      // Basic Auth - email & password
      {
        key: 'email',
        type: 'string',
        isNoSecret: true,
        required: true,
      },
      {
        key: 'password',
        type: 'password',
        isNoSecret: false,
        required: true,
      },

      // Custom Auth - api key
      {
        key: 'api_key',
        type: 'string',
        isNoSecret: false,
        required: true,
      },
    ],

    antiExamples: [
      {
        example: {
          key: 'password',
          type: 'password',
          isNoSecret: true,
          required: true,
        },
        reason:
          '"password" is a sensitive field and cannot have isNoSecret set as true.',
      },
      {
        example: {
          key: 'api_key',
          isNoSecret: true,
        },
        reason:
          '"api_key" is a sensitive field and cannot have isNoSecret set as true.',
      },
      {
        example: {
          type: 'string',
          isNoSecret: false,
        },
        reason: 'Missing required key: key',
      },
    ],
  },
  [FieldChoicesSchema, FieldSchema],
);
