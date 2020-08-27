'use strict';

const makeSchema = require('../utils/makeSchema');

const FunctionSchema = require('./FunctionSchema');

module.exports = makeSchema(
  {
    id: '/FirehoseWebhookSchema',
    description:
      'To idenitfy firehose webhooks are their corresponding Zaps. ' +
      'For Zapier internal webhooks - not publically available.',
    type: 'object',
    docAnnotation: {
      hide: true,
    },
    required: ['performSubscriptionKeyList'],
    properties: {
      performSubscriptionKeyList: {
        description:
          'Takes a webhook payload and returns the list of subscription keys required to lookup subscribed Zaps.',
        $ref: FunctionSchema.id,
      },
    },
    additionalProperties: false,
  },
  [FunctionSchema]
);
