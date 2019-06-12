'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/ResultsSchema',
  description: 'An array of objects suitable for returning in perform calls.',
  type: 'array',
  items: {
    type: 'object',
    // TODO: require id, ID, Id property?
    minProperties: 1
  }
});
