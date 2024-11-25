'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/FieldMetaSchema',
  type: 'object',
  description: 'Allows for additional metadata to be stored on the field.',
  patternProperties: {
    '[^\\s]+': {
      description: 'Only string, integer or boolean values are allowed.',
      anyOf: [{ type: 'string' }, { type: 'integer' }, { type: 'boolean' }],
    },
  },
  examples: [
    { shouldCapitalize: true },
    { shouldCapitalize: true, internalType: 'datetime' },
  ],
  antiExamples: [
    {
      example: { databank: { primaryContact: 'abc' } },
      reason: 'No complex values allowed',
    },
    {
      example: { needsProcessing: null },
      reason: 'No null values allowed',
    },
  ],
});
