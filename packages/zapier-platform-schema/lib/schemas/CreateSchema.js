'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicOperationSchema = require('./BasicOperationSchema');
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
      $ref: BasicOperationSchema.id
    },
    getResourceOperation: {
      description: 'How to take a skinny create result and fetch the complete record. Use when the returned result only contains a subset of the data or when pairing the create with a search for searchOrCreate.',
      $ref: BasicOperationSchema.id
    }
  },
  additionalProperties: false
}, [
  BasicDisplaySchema,
  BasicOperationSchema,
  KeySchema,
]);
