'use strict';

const makeSchema = require('../utils/makeSchema');
const FunctionSchema = require('./FunctionSchema');

module.exports = makeSchema({
  id: '/HydratorsSchema',
  description:
    "A bank of named functions that you can use in `z.hydrate('someName')` to lazily load data.",
  type: 'object',
  patternProperties: {
    '^[a-zA-Z]+[a-zA-Z0-9]*$': {
      description:
        "Any unique key can be used in `z.hydrate('uniqueKeyHere')`.",
      $ref: FunctionSchema.id
    }
  },
  additionalProperties: false
});
