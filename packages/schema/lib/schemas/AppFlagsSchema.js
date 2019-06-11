'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/AppFlagsSchema',
  description: 'Codifies high-level options for your app.',
  type: 'object',
  properties: {
    skipHttpPatch: {
      description:
        "By default, Zapier patches the core `http` module so that all requests (including those from 3rd-party SDKs) can be logged. Set this to true if you're seeing issues using an SDK (such as AWS).",
      type: 'boolean'
    }
  },
  additionalProperties: false,
  examples: [{ skipHttpPatch: true }, { skipHttpPatch: false }, {}],
  antiExamples: [{ blah: true }, { skipHttpPatch: 'yes' }]
});
