'use strict';

const makeSchema = require('../utils/makeSchema');

const FlatObjectSchema = require('./FlatObjectSchema');
const FunctionSchema = require('./FunctionSchema');

module.exports = makeSchema(
  {
    id: '/RequestSchema',
    description:
      'A representation of a HTTP request - you can use the `{{syntax}}` to inject authentication, field or global variables.',
    type: 'object',
    properties: {
      method: {
        description: 'The HTTP method for the request.',
        type: 'string',
        default: 'GET',
        enum: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'HEAD'],
      },
      url: {
        description:
          'A URL for the request (we will parse the querystring and merge with params). Keys and values will not be re-encoded.',
        type: 'string',
      },
      body: {
        description: 'Can be nothing, a raw string or JSON (object or array).',
        oneOf: [
          { type: 'null' }, // nothing
          { type: 'string' }, // raw body
          { type: 'object' }, // json body object
          { type: 'array' }, // json body array
        ],
      },
      params: {
        description:
          'A mapping of the querystring - will get merged with any query params in the URL. Keys and values will be encoded.',
        $ref: FlatObjectSchema.id,
      },
      headers: {
        description: 'The HTTP headers for the request.',
        $ref: FlatObjectSchema.id,
      },
      auth: {
        description:
          "An object holding the auth parameters for OAuth1 request signing, like `{oauth_token: 'abcd', oauth_token_secret: '1234'}`. Or an array reserved (i.e. not implemented yet) to hold the username and password for Basic Auth. Like `['AzureDiamond', 'hunter2']`.",
        oneOf: [
          {
            type: 'array',
            items: {
              type: 'string',
              minProperties: 2,
              maxProperties: 2,
            },
          },
          { $ref: FlatObjectSchema.id },
        ],
      },
      removeMissingValuesFrom: {
        description:
          'Should missing values be sent? (empty strings, `null`, and `undefined` only — `[]`, `{}`, and `false` will still be sent). Allowed fields are `params` and `body`. The default is `false`, ex: ```removeMissingValuesFrom: { params: false, body: false }```',
        type: 'object',
        properties: {
          params: {
            description:
              'Refers to data sent via a requests query params (`req.params`)',
            type: 'boolean',
            default: false,
          },
          body: {
            description:
              'Refers to tokens sent via a requsts body (`req.body`)',
            type: 'boolean',
            default: false,
          },
        },
        additionalProperties: false,
      },
      serializeValueForCurlies: {
        description:
          'A function to customize how to serialize a value for curlies `{{var}}` in the request object. By default, when this is unspecified, the request client only replaces curlies where variables are strings, and would throw an error for non-strings. The function should accepts a single argument as the value to be serialized and return the string representation of the argument.',
        $ref: FunctionSchema.id,
      },
      skipThrowForStatus: {
        description:
          "If `true`, don't throw an exception for response 400 <= status < 600 automatically before resolving with the response. Defaults to `false`.",
        type: 'boolean',
        default: false,
      },
    },
    additionalProperties: false,
  },
  [FlatObjectSchema, FunctionSchema]
);
