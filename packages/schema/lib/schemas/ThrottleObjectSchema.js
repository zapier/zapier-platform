'use strict';

const makeSchema = require('../utils/makeSchema');

const ThrottleOverrideObjectSchema = require('./ThrottleOverrideObjectSchema');

module.exports = makeSchema(
  {
    id: '/ThrottleObjectSchema',
    description:
      'Zapier uses this configuration to apply throttling when the limit for the window is exceeded. **NOTE:** The final key used for the throttling is formed as a combination of all the configurations; key, window, limit, and scope. To share a limit across multiple actions in an integration, each should have the same configuration set without "action" in the scope.',
    type: 'object',
    required: ['window', 'limit'],
    properties: {
      window: {
        description:
          'The timeframe, in seconds, within which the system tracks the number of invocations for an action. The number of invocations begins at zero at the start of each window.',
        type: 'integer',
      },
      limit: {
        description:
          'The maximum number of invocations for an action, allowed within the timeframe window.',
        type: 'integer',
      },
      key: {
        description:
          'The key to throttle with in combination with the scope. User data provided for the input fields can be used in the key with the use of the curly braces referencing. For example, to access the user data provided for the input field "test_field", use `{{bundle.inputData.test_field}}`. Note that a required input field should be referenced to get user data always.',
        type: 'string',
        minLength: 1,
      },
      scope: {
        description: `The granularity to throttle by. You can set the scope to one or more of the following: 'user' - Throttles based on user ids.  'auth' - Throttles based on auth ids. 'account' - Throttles based on account ids for all users under a single account. 'action' - Throttles the action it is set on separately from other actions. By default, throttling is scoped to the action and account.`,
        type: 'array',
        items: {
          enum: ['user', 'auth', 'account', 'action'],
          type: 'string',
        },
      },
      retry: {
        description:
          'The effect of throttling on the tasks of the action. `true` means throttled tasks are automatically retried after some delay, while `false` means tasks are held without retry. It defaults to `true`. NOTE that it has no effect on polling triggers and should not be set.',
        type: 'boolean',
      },
      filter: {
        description: `EXPERIMENTAL: Account-based attribute to override the throttle by. You can set to one of the following: "free", "trial", "paid". Therefore, the throttle scope would be automatically set to "account" and ONLY the accounts based on the specified filter will have their requests throttled based on the throttle overrides while the rest are throttled based on the original configuration.`,
        type: 'string',
        enum: ['free', 'trial', 'paid'],
      },
      overrides: {
        description:
          'EXPERIMENTAL: Overrides the original throttle configuration based on a Zapier account attribute.',
        type: 'array',
        minItems: 1,
        items: {
          $ref: ThrottleOverrideObjectSchema.id,
        },
      },
    },
    examples: [
      {
        window: 60,
        limit: 100,
      },
      {
        window: 600,
        limit: 100,
        scope: ['account', 'user'],
      },
      {
        window: 3600,
        limit: 10,
        scope: ['auth'],
      },
      {
        window: 3600,
        limit: 10,
        key: 'random_key',
        scope: [], // this ensures neither the default nor any of the scope options is used
      },
      {
        window: 3600,
        limit: 10,
        key: 'random_key-{{bundle.inputData.test_field}}',
        scope: ['action', 'auth'],
        retry: false,
      },
      {
        window: 3600,
        limit: 10,
        scope: ['auth'],
        retry: false,
        overrides: [
          {
            window: 3600,
            limit: 2,
            filter: 'free',
            retry: false,
          },
        ],
      },
    ],
    antiExamples: [
      {
        example: {
          window: 60,
          limit: 100,
          scope: ['zap'],
        },
        reason: 'Invalid scope provided: `zap`.',
      },
      {
        example: { limit: 10 },
        reason: 'Missing required key: `window`.',
      },
      {
        example: { window: 600 },
        reason: 'Missing required key: `limit`.',
      },
      {
        example: { window: 600, limit: 100, overrides: [] },
        reason: 'The overrides needs at least one item.',
      },
      {
        example: {},
        reason: 'Missing required keys: `window` and `limit`.',
      },
    ],
    additionalProperties: false,
  },
  [ThrottleOverrideObjectSchema],
);
