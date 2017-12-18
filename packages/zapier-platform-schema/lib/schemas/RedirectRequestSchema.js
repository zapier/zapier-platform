'use strict';

const makeSchema = require('../utils/makeSchema');

const FlatObjectSchema = require('./FlatObjectSchema');

module.exports = makeSchema(
  {
    id: '/RedirectRequestSchema',
    description:
      'A representation of a HTTP redirect - you can use the `{{syntax}}` to inject authentication, field or global variables.',
    type: 'object',
    properties: {
      method: {
        description: 'The HTTP method for the request.',
        type: 'string',
        default: 'GET',
        enum: ['GET']
      },
      url: {
        description:
          'A URL for the request (we will parse the querystring and merge with params). Keys and values will not be re-encoded.',
        type: 'string'
      },
      params: {
        description:
          'A mapping of the querystring - will get merged with any query params in the URL. Keys and values will be encoded.',
        $ref: FlatObjectSchema.id
      }
    },
    additionalProperties: false
  },
  [FlatObjectSchema]
);
