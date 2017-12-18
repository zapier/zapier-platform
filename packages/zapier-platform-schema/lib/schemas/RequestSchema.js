'use strict';

const makeSchema = require('../utils/makeSchema');

const FlatObjectSchema = require('./FlatObjectSchema');

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
        enum: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'HEAD']
      },
      url: {
        description:
          'A URL for the request (we will parse the querystring and merge with params). Keys and values will not be re-encoded.',
        type: 'string'
      },
      body: {
        description: 'Can be nothing, a raw string or JSON (object or array).',
        oneOf: [
          { type: 'null' }, // nothing
          { type: 'string' }, // raw body
          { type: 'object' }, // json body object
          { type: 'array' } // json body array
        ]
      },
      params: {
        description:
          'A mapping of the querystring - will get merged with any query params in the URL. Keys and values will be encoded.',
        $ref: FlatObjectSchema.id
      },
      headers: {
        description: 'The HTTP headers for the request.',
        $ref: FlatObjectSchema.id
      },
      auth: {
        description:
          "The username and password for Basic Auth. Like `['AzureDiamond', 'hunter2']`.",
        type: 'array',
        items: {
          type: 'string',
          minProperties: 2,
          maxProperties: 2
        }
      }
    },
    additionalProperties: false
  },
  [FlatObjectSchema]
);
