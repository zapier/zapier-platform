'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicPollingOperationSchema = require('./BasicPollingOperationSchema');

module.exports = makeSchema({
  id: '/ResourceMethodListSchema',
  description: 'How will we get a list of new objects? Will be turned into a trigger automatically.',
  type: 'object',
  required: ['display', 'operation'],
  properties: {
    display: {
      description: 'Define how this list/trigger method will be exposed in the UI.',
      $ref: BasicDisplaySchema.id
    },
    operation: {
      description: 'Define how this list/trigger method will work.',
      $ref: BasicPollingOperationSchema.id
    }
  },
  additionalProperties: false
}, [
  BasicDisplaySchema,
  BasicPollingOperationSchema
]);
