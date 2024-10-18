import type { Authentication } from 'zapier-platform-core';

import { SCOPES } from './constants';

export default {
  type: 'oauth2',
  test: { url: 'https://api.example.com/v2/token/authorized_by' },
  connectionLabel: '{{email}}',
  oauth2Config: {
    authorizeUrl: {
      url: 'https://example.com/oauth/authorize',
      params: {
        client_id: '{{process.env.CLIENT_ID}}',
        response_type: 'code',
        scope: SCOPES.join(' '),
        redirect_uri: '{{bundle.inputData.redirect_uri}}',
        state: '{{bundle.inputData.state}}',
      },
    },
    getAccessToken: {
      url: 'https://api.example.com/oauth/access_token',
      method: 'POST',
      params: {
        client_id: '{{process.env.CLIENT_ID}}',
        client_secret: '{{process.env.CLIENT_SECRET}}',
        code: '{{bundle.inputData.code}}',
        grant_type: 'authorization_code',
        redirect_uri: '{{bundle.inputData.redirect_uri}}',
      },
    },
  },
} satisfies Authentication;
