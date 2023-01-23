'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/AppFlagsSchema',
  description: 'Codifies high-level options for your integration.',
  type: 'object',
  properties: {
    skipHttpPatch: {
      description:
        "By default, Zapier patches the core `http` module so that all requests (including those from 3rd-party SDKs) can be logged. Set this to true if you're seeing issues using an SDK (such as AWS).",
      type: 'boolean',
    },
    skipThrowForStatus: {
      description:
        'Starting in `core` version `10.0.0`, `response.throwForStatus()` was called by default. We introduced a per-request way to opt-out of this behavior. This flag takes that a step further and controls that behavior integration-wide **for requests made using `z.request()`**. Unless they specify otherwise (per-request, or via middleware), [Shorthand requests](https://github.com/zapier/zapier-platform/blob/main/packages/cli/README.md#shorthand-http-requests) _always_ call `throwForStatus()`. `z.request()` calls can also ignore this flag if they set `skipThrowForStatus` directly',
      type: 'boolean',
    },
  },
  additionalProperties: false,
  examples: [
    { skipHttpPatch: true, skipThrowForStatus: false },
    { skipHttpPatch: false, skipThrowForStatus: true },
    {},
  ],
  antiExamples: [
    { example: { foo: true }, reason: 'Invalid key.' },
    { example: { skipHttpPatch: 'yes' }, reason: 'Invalid value.' },
    { example: { skipThrowForStatus: 'no' }, reason: 'Invalid value.' },
  ],
});
