'use strict';

const makeSchema = require('../utils/makeSchema');

const BasicDisplaySchema = require('./BasicDisplaySchema');
const BasicOperationSchema = require('./BasicOperationSchema');
const KeySchema = require('./KeySchema');

module.exports = makeSchema({
  id: '/SearchSchema',
  description: 'How will we search for new objects?',
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
      $ref: BasicOperationSchema.id
    },
    getResourceOperation: {
      description: 'How to take a skinny search result and fetch the complete record. Use when the returned results only contain a subset of the data or when pairing the search with a create for searchOrCreate.',
      $ref: BasicOperationSchema.id
    }
  },
  additionalProperties: false
}, [
  BasicDisplaySchema,
  BasicOperationSchema,
  KeySchema,
]);
