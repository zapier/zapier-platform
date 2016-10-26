'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicOperationSchema = require('./BasicOperationSchema');

module.exports = makeSchema({
  id: '/ResourceMethodSearchSchema',
  description: 'How will we find a specific object given filters or search terms? Will be turned into a search automatically.',
  type: 'object',
  required: ['display', 'operation'],
  properties: {
    display: {
      description: 'Define how this search method will be exposed in the UI.',
      $ref: BasicDisplaySchema.id
    },
    operation: {
      description: 'Define how this search method will work.',
      $ref: BasicOperationSchema.id
    }
  },
  additionalProperties: false
}, [
  BasicDisplaySchema,
  BasicOperationSchema
]);
