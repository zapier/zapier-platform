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
    required: ['subscriptionLookup'],
    properties: {
      subscriptionLookup: {
        description:
          'Takes a webhook payload and returns the identifier required to lookup subscribed Zaps.',
        $ref: FunctionSchema.id
      },
      dedupe: {
        description:
          'set to true if your API sends duplicate webhook events, and Zapier needs to filter duplicates',
        type: 'boolean'
      },
      batchKey: {
        description:
          'if your API sends webhooks in batches (ie a list/array of events) and the events are nested under a json key, provide the key',
        type: 'string'
      },
      challenge: {
        description:
          'For APIs that send challenge payloads to the webhook endpoint, as well as webhook events',
        type: 'object',
        required: ['sendsChallenge'],
        properties: {
          sendsChallenge: {
            description:
              'does the API send challenges to the webhook endpoint, as well as the expected webhook events?',
            type: 'boolean'
          },
          location: {
            description:
              'where in the request we should look to find the challenge value',
            type: 'string',
            enum: ['query_string', 'body']
          },
          key: {
            description:
              "the key containing the challenge value. We'll response to the request with this value",
            type: 'string'
          }
        }
      }
    },
    additionalProperties: true
  },
  [FunctionSchema]
);
