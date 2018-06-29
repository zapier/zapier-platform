'use strict';

const testAuthSource = `
  const responsePromise = z.request({
    url: 'https://auth-json-server.zapier.ninja/me'
  });
  return responsePromise.then(response => {
    if (response.status !== 200) {
      throw new Error('Auth failed');
    }
    return z.JSON.parse(response.content);
  });
`;

const maybeIncludeAuthSource = `
  if (bundle.authData.api_key) {
    request.headers['X-API-Key'] = bundle.authData.api_key;
  }
  return request;
`;

module.exports = {
  authentication: {
    type: 'custom',
    test: { source: testAuthSource },
    fields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'string',
        required: true
      }
    ]
  },
  beforeRequest: [
    { source: maybeIncludeAuthSource, args: ['request', 'z', 'bundle'] }
  ]
};
