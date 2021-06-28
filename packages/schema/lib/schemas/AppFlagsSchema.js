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
      type: 'boolean',
    },
    disableRawRequest: {
      description:
        "If your app uses our built-in authentication types like basic/oauth1/digest, or defines a beforeRequest middleware -- the user may have the option to make a raw request to your API. You can set this true to disable it.",
      type: 'boolean',
    },
    rawRequestDomainFilter: {
      description:
        "If `disableRawRequest` is not set and this, or the `RAW_REQUEST_DOMAIN_FILTER` env var, is provided, the user may have the option to make a raw request to your API but only to the domains that match this fnmatch filter. For example, you could provide `*.myapp.com` or `api.myapp.com`.",
      type: 'string',
    },
  },
  additionalProperties: false,
  examples: [{ skipHttpPatch: true }, { skipHttpPatch: false }, {}, {disableRawRequest: true}, {rawRequestDomainFilter: '*.myapp.com'}, {rawRequestDomainFilter: 'api.myapp.com'}, {rawRequestDomainFilter: 'myapp.com'}],
  antiExamples: [
    { example: { foo: true }, reason: 'Invalid key.' },
    { example: { skipHttpPatch: 'yes' }, reason: 'Invalid value.' },
    { example: { rawRequestDomainFilter: 'website.com/*' }, reason: 'Only domains are matched.' },
    { example: { rawRequestDomainFilter: '\\w+.api.website.com' }, reason: 'Regex is not supported.' },
  ],
});
