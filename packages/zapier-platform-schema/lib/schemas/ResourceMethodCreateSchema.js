'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicOperationSchema = require('./BasicOperationSchema');

module.exports = makeSchema({
  id: '/ResourceMethodCreateSchema',
  description: 'How will we find create a specific object given inputs? Will be turned into a create automatically.',
  type: 'object',
  required: ['display', 'operation'],
  properties: {
    display: {
      description: 'Define how this create method will be exposed in the UI.',
      $ref: BasicDisplaySchema.id
    },
    operation: {
      description: 'Define how this create method will work.',
      $ref: BasicOperationSchema.id
    }
  },
  additionalProperties: false
}, [
  BasicDisplaySchema,
  BasicOperationSchema
]);
