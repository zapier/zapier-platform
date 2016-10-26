'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/FunctionSchema',
  description: 'Internal pointer to a function from the original source. Encodes arity and if `arguments` is used in the body. Note - just write normal functions and the system will encode the pointers for you.',
  type: 'string',
  examples: [
    '$func$0$f$',
    '$func$2$t$'
  ],
  pattern: '^\\$func\\$\\d+\\$[tf]\\$$',
});
