'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/FieldMetaSchema',
  type: 'object',
  description:
    'Allows for additional metadata to be stored on the field. Only simple values are allowed (no objects or arrays)',
  additionalProperties: {
    type: ['string', 'number', 'boolean', 'null'],
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
  ],
});
