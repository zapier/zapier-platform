'use strict';

const makeSchema = require('../utils/makeSchema');

const FieldSchema = require('./FieldSchema');
const FunctionSchema = require('./FunctionSchema');

module.exports = makeSchema({
  id: '/DynamicFieldsSchema',
  description: 'Like [/FieldsSchema](#fieldsschema) but you can provide functions to create dynamic or custom fields.',
  examples: [
    [],
    '$func$2$f$',
    [{key: 'abc'}],
    [{key: 'abc'}, '$func$2$f$'],
  ],
  antiExamples: [
    [{}],
    [{key: 'abc', choices: {}}],
  ],
  oneOf: [
    {
      type: 'array',
      items: {
        oneOf: [
          {$ref: FieldSchema.id},
          {$ref: FunctionSchema.id}
        ]
      },
    },
    {$ref: FunctionSchema.id}
  ]
}, [
  FieldSchema,
  FunctionSchema,
]);
