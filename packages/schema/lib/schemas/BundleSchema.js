'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/BundleSchema',
  description: 'Given as the "arguments" or input to a perform call.',
  type: 'object',
  examples: [{}, { authData: {}, inputData: {}, inputDataRaw: {} }],
  antiExamples: [{ random: true }],
  properties: {
    authData: { type: 'object' },
    inputData: { type: 'object' },
    inputDataRaw: { type: 'object' },
  },
  additionalProperties: false,
});
