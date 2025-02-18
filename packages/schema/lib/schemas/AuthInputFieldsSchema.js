'use strict';

const makeSchema = require('../utils/makeSchema');

const AuthInputFieldSchema = require('./AuthInputFieldSchema');

module.exports = makeSchema(
  {
    id: '/AuthInputFieldsSchema',
    description: 'An array or collection of authentication fields.',
    type: 'array',
    items: {
      oneOf: [{ $ref: AuthInputFieldSchema.id }],
    },
    // Some complete examples
    examples: [
      // 1) Basic Auth: username (safe) + password (not safe)
      [
        { key: 'username', type: 'string', isNoSecret: true, required: true },
        {
          key: 'password',
          type: 'password',
          isNoSecret: false,
          required: true,
        },
      ],

      // 2) Just a single auth field for custom usage (e.g., api_key)
      [{ key: 'api_key', type: 'string', isNoSecret: false, required: true }],

      // 3) Mix of fields for extended usage
      [
        { key: 'email', type: 'string', isNoSecret: true },
        { key: 'password', type: 'password', required: true },
        { key: 'mfa_token', type: 'string', isNoSecret: false },
      ],
    ],

    // Anti-examples showing invalid arrays or invalid field objects
    antiExamples: [
      {
        example: {},
        reason: 'Must be an array (currently an object).',
      },
      {
        example: [{ key: 'password', isNoSecret: true }],
        reason:
          '"password" is a sensitive field and cannot have isNoSecret set as true.',
      },
      {
        example: [{ key: 'api_key', isNoSecret: true }],
        reason:
          '"api_key" is a sensitive field and cannot have isNoSecret set as true.',
      },
      {
        example: [{ isNoSecret: false }],
        reason: 'Missing required "key" property.',
      },
      {
        example: [{ key: 'username', type: 'string', isNoSecret: true }, 12345],
        reason:
          'Array item 12345 is not an object (must match AuthFieldSchema).',
      },
    ],
  },
  [AuthInputFieldSchema],
);
