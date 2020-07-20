'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/KeySchema',
  description: 'A unique identifier for this item.',
  type: 'string',
  minLength: 2,
  pattern: '^[a-zA-Z]+[a-zA-Z0-9_]*$',
});
