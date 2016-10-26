'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicOperationSchema = require('./BasicOperationSchema');

module.exports = makeSchema({
  id: '/ResourceMethodSearchOrCreateSchema',
  description: 'A wrapper operation to automatically create an object if it does not exist. By default, resources reuse existing search, create, and get functions. Only define this if you need to override the default behavior.',
  type: 'object',
  required: ['display', 'operation'],
  properties: {
    display: {
      description: 'Define how this search or create method will be exposed in the UI.',
      $ref: BasicDisplaySchema.id
    },
    operation: {
      description: 'Powers the functionality for this search or create.',
      $ref: BasicOperationSchema.id
    }
  },
  additionalProperties: false
}, [
  BasicDisplaySchema,
  BasicOperationSchema,
]);
