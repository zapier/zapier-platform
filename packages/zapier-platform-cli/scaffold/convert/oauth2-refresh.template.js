{
  // TODO: just an example stub - you'll need to complete
  type: 'oauth2',
  test: AuthTest.operation.perform,
  oauth2Config: {
    authorizeUrl: {
      method: 'GET',
      url: '<%= AUTHORIZE_URL %>',
      params: {
        client_id: '{{process.env.CLIENT_ID}}',
        state: '{{bundle.inputData.state}}',
        redirect_uri: '{{bundle.inputData.redirect_uri}}',
        response_type: 'code'
      }
    },
    getAccessToken: {
      method: 'POST',
      url: '<%= ACCESS_TOKEN_URL %>',
      body: {
        code: '{{bundle.inputData.code}}',
        client_id: '{{process.env.CLIENT_ID}}',
        client_secret: '{{process.env.CLIENT_SECRET}}',
        redirect_uri: '{{bundle.inputData.redirect_uri}}',
        grant_type: 'authorization_code'
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    },
    refreshAccessToken: {
      method: 'POST',
      url: '<%= REFRESH_TOKEN_URL %>',
      body: {
        refresh_token: '{{bundle.authData.refresh_token}}',
        client_id: '{{process.env.CLIENT_ID}}',
        client_secret: '{{process.env.CLIENT_SECRET}}',
        grant_type: 'refresh_token'
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    },
    scope: '<%= SCOPE %>',
    autoRefresh: true
  },
  connectionLabel: '<%= CONNECTION_LABEL %>'
}
