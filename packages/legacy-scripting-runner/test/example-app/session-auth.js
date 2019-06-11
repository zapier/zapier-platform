'use strict';

const testAuthSource = `
  return z.legacyScripting.run(bundle, 'trigger', 'contact_full');
`;

const getSessionKeySource = `
  return z.legacyScripting.run(bundle, 'auth.session');
`;

const getConnectionLabelSource = `
  return z.legacyScripting.run(bundle, 'auth.connectionLabel');
`;

const beforeRequestSource = `
  return z.legacyScripting.beforeRequest(request, z, bundle);
`;

const afterResponseSource = `
  return z.legacyScripting.afterResponse(response, z, bundle);
`;

module.exports = {
  legacy: {
    authentication: {
      mapping: {
        'X-Api-Key': '{{key1}}{{key2}}'
      },
      placement: 'header'
    },
    testTrigger: 'contact_full'
  },
  authentication: {
    type: 'session',
    test: { source: testAuthSource },
    fields: [
      {
        key: 'username',
        label: 'Username',
        type: 'string',
        required: true
      },
      {
        key: 'password',
        label: 'Password',
        type: 'password',
        required: true
      }
    ],
    sessionConfig: {
      perform: { source: getSessionKeySource }
    },
    connectionLabel: { source: getConnectionLabelSource }
  },
  beforeRequest: [
    { source: beforeRequestSource, args: ['request', 'z', 'bundle'] }
  ],
  afterResponse: [
    { source: afterResponseSource, args: ['response', 'z', 'bundle'] }
  ]
};
