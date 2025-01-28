'use strict';

const makeSchema = require('../utils/makeSchema');
const FieldSchema = require('./FieldSchema');

module.exports = makeSchema(
  {
    ...FieldSchema.schema,
    description: 'Field schema specialized for output fields.',
    id: '/OutputFieldSchema',
  },
  [FieldSchema],
);
