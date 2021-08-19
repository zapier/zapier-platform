'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/KeySchema',
  description: 'A unique identifier for this item.',
  type: 'string',
  minLength: 2,
  pattern: '^[a-zA-Z]+[a-zA-Z0-9_]*$',
  examples: ['vk', 'validKey', 'ValidKey', 'Valid_Key_2'],
  antiExamples: [
    {
      example: '',
      reason: 'Cannot be empty',
    },
    {
      example: 'A',
      reason: 'Minimum of two characters',
    },
    {
      example: '1_Key',
      reason: 'Must start with a letter',
    },
    {
      example: 'a-Key',
      reason: 'Must not use dashes',
    },
  ],
});
