'use strict';

const makeSchema = require('../utils/makeSchema');
const FieldChoicesSchema = require('./FieldChoicesSchema');
const FieldSchema = require('./FieldSchema');

module.exports = makeSchema(
  {
    id: '/AuthFieldSchema',
    description: `Field schema specialized for authentication fields. ${FieldSchema.schema.description}`,
    required: ['key'],
    type: 'object',
    properties: {
      ...FieldSchema.schema.properties,
      children: {
        type: 'array',
        items: { $ref: '/AuthFieldSchema' },
        description:
          'An array of child fields that define the structure of a sub-object for this field. Usually used for line items.',
        minItems: 1,
      },
      helpText: {
        description:
          'A human readable description of this value (IE: "The first part of a full name."). You can use Markdown.',
        type: 'string',
        minLength: 1,
        maxLength: 1000,
      },
      type: {
        description: 'The type of this value used to be.',
        type: 'string',
        enum: ['string', 'number', 'boolean', 'datetime', 'copy', 'password'],
      },
      required: {
        description:
          'If this value is required or not. This defaults to `true`.',
        type: 'boolean',
      },
      placeholder: {
        description: 'An example value that is not saved.',
        type: 'string',
        minLength: 1,
      },
      choices: {
        description:
          'An object of machine keys and human values to populate a static dropdown.',
        $ref: FieldChoicesSchema.id,
      },
      computed: {
        description:
          'Is this field automatically populated (and hidden from the user)? Note: Only OAuth and Session Auth support fields with this key.',
        type: 'boolean',
      },
      inputFormat: {
        description:
          'Useful when you expect the input to be part of a longer string. Put "{{input}}" in place of the user\'s input (IE: "https://{{input}}.yourdomain.com").',
        type: 'string',
        // TODO: Check if it contains one and ONLY ONE '{{input}}'
        pattern: '^.*{{input}}.*$',
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
