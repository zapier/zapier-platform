'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicOperationSchema = require('./BasicOperationSchema');

module.exports = makeSchema({
  id: '/ResourceMethodGetSchema',
  description: 'How will we get a single object given a unique identifier/id?',
  type: 'object',
  required: ['display', 'operation'],
  properties: {
    display: {
      description: 'Define how this get method will be exposed in the UI.',
      $ref: BasicDisplaySchema.id
    },
    operation: {
      description: 'Define how this get method will work.',
      $ref: BasicOperationSchema.id
    }
  },
  additionalProperties: false
}, [
  BasicDisplaySchema,
  BasicOperationSchema
]);
