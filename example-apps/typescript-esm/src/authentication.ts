import type { Authentication } from 'zapier-platform-core';

import { API_URL, SCOPES } from './constants.js';

export default {
  type: 'oauth2',
  test: { url: `${API_URL}/me` },
  connectionLabel: '{{email}}', // Set this from the test data.
  oauth2Config: {
    authorizeUrl: {
      url: `${API_URL}/oauth/authorize`,
      params: {
        client_id: '{{process.env.CLIENT_ID}}',
        response_type: 'code',
        scope: SCOPES.join(' '),
        redirect_uri: '{{bundle.inputData.redirect_uri}}',
        state: '{{bundle.inputData.state}}',
      },
    },
    getAccessToken: {
      url: `${API_URL}/oauth/access-token`,
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: {
        client_id: '{{process.env.CLIENT_ID}}',
        client_secret: '{{process.env.CLIENT_SECRET}}',
        code: '{{bundle.inputData.code}}',
        grant_type: 'authorization_code',
        redirect_uri: '{{bundle.inputData.redirect_uri}}',
      },
    },
    refreshAccessToken: {
      url: `${API_URL}/oauth/refresh-token`,
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: {
        client_id: '{{process.env.CLIENT_ID}}',
        client_secret: '{{process.env.CLIENT_SECRET}}',
        refresh_token: '{{bundle.authData.refresh_token}}',
        grant_type: 'refresh_token',
      },
    },
  },
} satisfies Authentication;
