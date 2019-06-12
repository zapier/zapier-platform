'use strict';

const makeSchema = require('../utils/makeSchema');

const FieldOrFunctionSchema = require('./FieldOrFunctionSchema');

module.exports = makeSchema(
  {
    id: '/DynamicFieldsSchema',
    description:
      'Like [/FieldsSchema](#fieldsschema) but you can provide functions to create dynamic or custom fields.',
    examples: [
      [],
      [{ key: 'abc' }],
      [{ key: 'abc' }, '$func$2$f$'],
      ['$func$2$f$', '$func$2$f$']
    ],
    antiExamples: [[{}], [{ key: 'abc', choices: {} }], '$func$2$f$'],
    $ref: FieldOrFunctionSchema.id
  },
  [FieldOrFunctionSchema]
);
