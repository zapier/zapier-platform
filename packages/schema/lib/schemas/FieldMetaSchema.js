'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/FieldMetaSchema',
  type: 'object',
  description:
    'Allows for additional metadata to be stored on the field. Only string, numeric or boolean values are allowed',
  additionalProperties: {
    type: ['string', 'number', 'boolean'],
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
