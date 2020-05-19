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

module.exports = {
  legacy: {
    authentication: {
      mapping: {
        'X-Api-Key': '{{key1}}{{key2}}',
      },
      placement: 'header',
    },
    testTrigger: 'contact_full',
  },
  authentication: {
    type: 'session',
    test: { source: testAuthSource },
    fields: [
      {
        key: 'username',
        label: 'Username',
        type: 'string',
        required: true,
      },
      {
        key: 'password',
        label: 'Password',
        type: 'password',
        required: true,
      },
    ],
    sessionConfig: {
      perform: { source: getSessionKeySource },
    },
    connectionLabel: { source: getConnectionLabelSource },
  },
};
