'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/LockObjectSchema',
  description:
    '**INTERNAL USE ONLY**. Zapier uses this configuration for internal operation locking.',
  type: 'object',
  required: ['key'],
  properties: {
    key: {
      description:
        'The key to use for locking. This should be unique to the operation. While actions of different integrations with the same key and scope will never lock each other out, actions of the same integration with the same key and scope will do. User data provided for the input fields can be used in the key with the use of the curly braces referencing. For example, to access the user data provided for the input field "test_field", use `{{bundle.inputData.test_field}}`. Note that a required input field should be referenced to get user data always.',
      type: 'string',
      minLength: 1,
    },
    scope: {
      description: `By default, locks are scoped to the app. That is, all users of the app will share the same locks. If you want to restrict serial access to a specific user, auth, or account, you can set the scope to one or more of the following: 'user' - Locks based on user ids.  'auth' - Locks based on unique auth ids. 'account' - Locks for all users under a single account. You may also combine scopes. Note that "app" is included, always, in the scope provided. For example, a scope of ['account', 'auth'] would result to ['app', 'account', 'auth'].`,
      type: 'array',
      items: {
        enum: ['user', 'auth', 'account'],
        type: 'string',
      },
    },
    timeout: {
      description:
        'The number of seconds to hold the lock before releasing it to become accessible to other task invokes that need it. If not provided, the default set by the app will be used. It cannot be more than 180.',
      type: 'integer',
    },
  },
  examples: [
    {
      key: 'random_key',
      scope: ['account', 'user'],
      timeout: 30,
    },
    {
      key: '{{bundle.inputData.test_field}}',
    },
  ],
  antiExamples: [
    {
      example: {
        key: 'random_key',
        scope: ['zap'],
      },
      reason: 'Invalid scope provided: `zap`.',
    },
    {
      example: {},
      reason: 'Missing required key: `key`.',
    },
  ],
  additionalProperties: false,
});
