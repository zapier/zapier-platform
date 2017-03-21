'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicActionOperationSchema = require('./BasicActionOperationSchema');
const KeySchema = require('./KeySchema');

module.exports = makeSchema({
  id: '/SearchSchema',
  description: 'How will Zapier search for existing objects?',
  type: 'object',
  required: ['key', 'noun', 'display', 'operation'],
  properties: {
    key: {
      description: 'A key to uniquely identify this search.',
      $ref: KeySchema.id
    },
    noun: {
      description: 'A noun for this search that completes the sentence "finds a specific XXX".',
      type: 'string',
      minLength: 2,
      maxLength: 255
    },
    display: {
      description: 'Configures the UI for this search.',
      $ref: BasicDisplaySchema.id
    },
    operation: {
      description: 'Powers the functionality for this search.',
      $ref: BasicActionOperationSchema.id
    }
  },
  additionalProperties: false
}, [
  BasicDisplaySchema,
  BasicActionOperationSchema,
  KeySchema,
]);
