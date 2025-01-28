'use strict';

const makeSchema = require('../utils/makeSchema');
const BaseFieldSchema = require('./BaseFieldSchema');

module.exports = makeSchema(
  {
    id: '/InputFieldSchema',
    description: 'Field schema specialized for input fields (simplified).',
    type: 'object',
    allOf: [
      { $ref: BaseFieldSchema.id },
      {
        type: 'object',
        properties: {
          urlPatterns: {
            description: 'A non-empty array of valid URL patterns (strings).',
            type: 'array',
            minItems: 1,
            items: {
              type: 'string',
            },
          },
        },
        additionalProperties: false,
      },
      {
        // If urlPatterns is present, forbid certain properties & ensure type is 'string' or absent
        if: { required: ['urlPatterns'] },
        then: {
          not: {
            anyOf: [
              { required: ['choices'] },
              { required: ['list'] },
              { required: ['children'] },
              { required: ['dict'] },
              { required: ['computed'] },
              { required: ['altersDynamicFields'] },
              { required: ['inputFormat'] },
            ],
          },
          properties: {
            type: {
              enum: ['string', undefined],
            },
          },
        },
      },
    ],
  },
  [BaseFieldSchema],
);
