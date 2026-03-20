'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/JsonSchemaSchema',
  description:
    'A JSON Schema object that describes the expected structure of a JSON value. Validated against the official JSON Schema Draft 4 meta-schema via the schemaRequiresJsonType functional constraint.',
  type: 'object',
  additionalProperties: true,
  examples: [
    { type: 'object', properties: { name: { type: 'string' } } },
    { type: 'array', items: { type: 'string' } },
    { type: ['string', 'null'] },
    {},
    {
      allOf: [{ type: 'object' }, { properties: { name: { type: 'string' } } }],
      not: { type: 'array' },
    },
    {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
      },
      required: ['name'],
      additionalProperties: false,
    },
  ],
  antiExamples: [
    {
      example: ['not', 'an', 'object'],
      reason: 'JSON Schema must be an object, not an array',
    },
  ],
});
