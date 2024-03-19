'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/ThrottleObjectSchema',
  description:
    'Zapier uses this configuration to apply throttling when the limit for the window is exceeded.',
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
    scope: {
      description: `The granularity to throttle by. You can set the scope to one or more of the following: 'user' - Throttles based on user ids.  'auth' - Throttles based on auth ids. 'account' - Throttles based on account ids for all users under a single account. By default, throttling is scoped to the account.`,
      type: 'array',
      items: {
        enum: ['user', 'auth', 'account'],
        type: 'string',
      },
    },
    overrides: {
      description: `Overrides the original throttle configuration based on a Zapier account attribute.`,
      type: 'array',
      items: {
        type: 'object',
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
          filter: {
            description: `Account-based attribute to override the throttle by. You can set to one of the following: "free", "trial", "paid". Therefore, the throttle scope would be automatically set to "account" and ONLY the accounts based on the specified filter will have their requests throttled based on the throttle overrides while the rest are throttled based on the original configuration.`,
            type: 'string',
          },
        }
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
      scope: ['auth'],
      overrides: [{
        window: 3600,
        limit: 2,
        filter: 'free',
      }],
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
      example: {limit: 10},
      reason: 'Missing required key: `window`.',
    },
    {
      example: {window: 600},
      reason: 'Missing required key: `limit`.',
    },
    {
      example: {},
      reason: 'Missing required keys: `window` and `limit`.',
    },
  ],
  additionalProperties: false,
});
