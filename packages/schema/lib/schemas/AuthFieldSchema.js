'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/AuthFieldSchema',
  description: 'Field schema specialized for authentication fields.',
  required: ['key'],
  type: 'object',
  properties: {
    key: {
      description:
        'A unique machine readable key for this value (IE: "fname").',
      type: 'string',
      minLength: 1,
    },
    isNotSecret: {
      description:
        'Indicates if this authentication field is safe (not secret).',
      type: 'boolean',
    },
    label: {
      description: 'A human readable label for this value (IE: "First Name").',
      type: 'string',
      minLength: 1,
    },
    helpText: {
      description:
        'A human readable description of this value (IE: "The first part of a full name."). You can use Markdown.',
      type: 'string',
      minLength: 1,
      maxLength: 1000,
    },
    type: {
      description:
        'The type of this value. Field type of `file` will accept either a file object or a string. If a URL is provided in the string, Zapier will automatically make a GET for that file. Otherwise, a .txt file will be generated.',
      type: 'string',
      // string == unicode
      // text == a long textarea string
      // integer == int
      // number == float
      enum: ['string', 'number', 'boolean', 'datetime', 'password', 'copy'],
    },
    required: {
      description: 'If this value is required or not. This defaults to True.',
      type: 'boolean',
    },
    placeholder: {
      description: 'An example value that is not saved.',
      type: 'string',
      minLength: 1,
    },
    list: {
      description: 'Can a user provide multiples of this field?',
      type: 'boolean',
    },
    children: {
      type: 'array',
      items: { $ref: '/AuthFieldSchema' },
      description:
        'An array of child fields that define the structure of a sub-object for this field. Usually used for line items.',
      minItems: 1,
    },
    dict: {
      description: 'Is this field a key/value input?',
      type: 'boolean',
    },
    inputFormat: {
      description:
        'Useful when you expect the input to be part of a longer string. Put "{{input}}" in place of the user\'s input (IE: "https://{{input}}.yourdomain.com").',
      type: 'string',
      // TODO: Check if it contains one and ONLY ONE '{{input}}'
      pattern: '^.*{{input}}.*$',
    },
  },

  // Add examples and anti-examples specifically for basic & custom auth
  examples: [
    // Basic Auth - email & password
    {
      key: 'email',
      type: 'string',
      isNotSecret: true,
      required: true,
    },
    {
      key: 'password',
      type: 'password',
      isNotSecret: false,
      required: true,
    },

    // Custom Auth - api key
    {
      key: 'api_key',
      type: 'string',
      isNotSecret: false,
      required: true,
    },
  ],

  antiExamples: [
    {
      example: {
        key: 'password',
        type: 'password',
        isNotSecret: true,
        required: true,
      },
      reason: 'A "password" field cannot have isSafe = true.',
    },
    {
      example: {
        key: 'api_key',
        isNotSecret: true,
      },
      reason:
        '"api_key" is a sensitive field and cannot have isSafe set as true.',
    },
    {
      example: {
        type: 'string',
        isNotSecret: false,
      },
      reason: 'Missing required key: key',
    },
  ],
});
