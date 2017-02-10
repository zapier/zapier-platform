'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicActionOperationSchema = require('./BasicActionOperationSchema');
const KeySchema = require('./KeySchema');

module.exports = makeSchema({
  id: '/CreateSchema',
  description: 'How will we get a create new objects?',
  type: 'object',
  required: ['key', 'noun', 'display', 'operation'],
  properties: {
    key: {
      description: 'A key to uniquely identify this create.',
      $ref: KeySchema.id
    },
    noun: {
      description: 'A noun for this create that completes the sentence "creates a new XXX".',
      type: 'string',
      minLength: 2,
      maxLength: 255
    },
    display: {
      description: 'Configures the UI for this create.',
      $ref: BasicDisplaySchema.id
    },
    operation: {
      description: 'Powers the functionality for this create.',
      $ref: BasicActionOperationSchema.id
    }
  },
  additionalProperties: false
}, [
  BasicDisplaySchema,
  BasicActionOperationSchema,
  KeySchema,
]);
