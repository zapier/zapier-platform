'use strict';

const makeSchema = require('../utils/makeSchema');

const AuthFieldSchema = require('./AuthFieldSchema');

module.exports = makeSchema(
  {
    id: '/AuthFieldsSchema',
    description: 'An array or collection of authentication fields.',
    type: 'array',
    items: {
      oneOf: [{ $ref: AuthFieldSchema.id }],
    },
    // Some complete examples
    examples: [
      // 1) Basic Auth: username (safe) + password (not safe)
      [
        { key: 'username', type: 'string', isSafe: true, required: true },
        { key: 'password', type: 'password', isSafe: false, required: true },
      ],

      // 2) Just a single auth field for custom usage (e.g., api_key)
      [{ key: 'api_key', type: 'string', isSafe: false, required: true }],

      // 3) Mix of fields for extended usage
      [
        { key: 'email', type: 'string', isSafe: true },
        { key: 'password', type: 'password', required: true },
        { key: 'mfa_token', type: 'string', isSafe: false },
      ],
    ],

    // Anti-examples showing invalid arrays or invalid field objects
    antiExamples: [
      {
        example: {},
        reason: 'Must be an array (currently an object).',
      },
      {
        example: [{ key: 'password', isSafe: true }],
        reason:
          '"password" is a sensitive field and cannot have isSafe set as true.',
      },
      {
        example: [{ key: 'api_key', isSafe: true }],
        reason:
          '"api_key" is a sensitive field and cannot have isSafe set as true.',
      },
      {
        example: [{ isSafe: false }],
        reason: 'Missing required "key" property.',
      },
      {
        example: [{ key: 'username', type: 'string', isSafe: true }, 12345],
        reason: 'Array item 12345 is not an object (must match AuthFieldSchema).',
      },
    ],
  },
  [AuthFieldSchema],
);
