'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/JsonSchemaSchema',
  description:
    'A JSON Schema object that describes the expected structure of a JSON value. Validated against JSON Schema Draft 4, 6, or 7 meta-schema (based on the `$schema` field, defaulting to Draft 4) via the schemaRequiresJsonType functional constraint.',
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
    {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    },
  ],
  antiExamples: [
    {
      example: ['not', 'an', 'object'],
      reason: 'JSON Schema must be an object, not an array',
    },
  ],
});
