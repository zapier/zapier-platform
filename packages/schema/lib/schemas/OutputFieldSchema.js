'use strict';

const makeSchema = require('../utils/makeSchema');
const BaseFieldSchema = require('./BaseFieldSchema');

module.exports = makeSchema(
  {
    id: '/OutputFieldSchema',
    description: 'Field schema specialized for output fields.',
    type: 'object',
    allOf: [
      { $ref: BaseFieldSchema.id },
      {
        type: 'object',
        properties: {
          isCanonicalUrl: { type: 'boolean' },
          isCanonicalFile: { type: 'boolean' },
          isTitle: { type: 'boolean' },
          fileType: {
            type: 'string',
            description: "A string indicating a file's MIME type, if relevant.",
          },
        },
        additionalProperties: false,
      },
    ],
  },
  [BaseFieldSchema],
);
