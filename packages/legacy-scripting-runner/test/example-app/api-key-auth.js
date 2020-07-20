const { AUTH_JSON_SERVER_URL } = require('../constants');

const testAuthSource = `
  const responsePromise = z.request({
    url: '${AUTH_JSON_SERVER_URL}/me'
  });
  return responsePromise.then(response => {
    if (response.status !== 200) {
      throw new Error('Auth failed');
    }
    return z.JSON.parse(response.content);
  });
`;

module.exports = {
  legacy: {
    authentication: {
      mapping: { 'X-Api-Key': '{{api_key}}' },
      placement: 'header',
    },
  },

  authentication: {
    type: 'custom',
    test: { source: testAuthSource },
    fields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'string',
        required: true,
      },
    ],
  },
};
