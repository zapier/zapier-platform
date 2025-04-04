'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/ThrottleOverrideObjectSchema',
  description:
    'EXPERIMENTAL: Overrides the original throttle configuration based on a Zapier account attribute.',
  type: 'object',
  required: ['window', 'limit', 'filter'],
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
      enum: ['free', 'trial', 'paid'],
    },
    retry: {
      description:
        'The effect of throttling on the tasks of the action. `true` means throttled tasks are automatically retried after some delay, while `false` means tasks are held without retry. It defaults to `true`. NOTE that it has no effect on polling triggers and should not be set.',
      type: 'boolean',
    },
  },
  examples: [
    {
      window: 60,
      limit: 100,
      filter: 'free',
    },
    {
      window: 60,
      limit: 100,
      filter: 'paid',
      retry: false,
    },
    {
      window: 60,
      limit: 100,
      filter: 'trial',
      retry: true,
    },
  ],
  antiExamples: [
    {
      example: { limit: 10 },
      reason: 'Missing required key: `window` and `filter`.',
    },
    {
      example: { window: 600 },
      reason: 'Missing required key: `limit` and `filter`.',
    },
    {
      example: { filter: 'trial' },
      reason: 'Missing required key: `window` and `limit`.',
    },
    {
      example: {},
      reason: 'Missing required keys: `window`, `limit`, and `filter`.',
    },
  ],
  additionalProperties: false,
});
