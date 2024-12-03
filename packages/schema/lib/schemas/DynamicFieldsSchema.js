'use strict';

const makeSchema = require('../utils/makeSchema');

const FieldOrFunctionSchema = require('./FieldOrFunctionSchema');

module.exports = makeSchema(
  {
    id: '/DynamicFieldsSchema',
    description:
      'Like [/FieldsSchema](#fieldsschema) but you can provide functions to create dynamic or custom fields.',
    $ref: FieldOrFunctionSchema.id,
    examples: [
      [],
      [{ key: 'abc' }],
      [{ key: 'abc' }, '$func$2$f$'],
      ['$func$2$f$', '$func$2$f$'],
    ],
    antiExamples: [
      {
        example: [{}],
        reason: 'FieldSchema missing required key: key',
      },
      {
        example: [{ key: 'abc', choices: {} }],
        reason:
          'Invalid value for key in FieldSchema: choices (cannot be empty)',
      },
      {
        example: '$func$2$f$',
        reason: 'Must be an array',
      },
    ],
  },
  [FieldOrFunctionSchema],
);
