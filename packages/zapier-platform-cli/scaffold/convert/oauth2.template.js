const { replaceVars } = require('./utils');
const testTrigger = require('<%= TEST_TRIGGER_MODULE %>');
<% if (hasPreOAuthTokenScripting && hasPostOAuthTokenScripting) { %>
const getAccessToken = (z, bundle) => {
  const scripting = require('./scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= ACCESS_TOKEN_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle);

  // Do a pre_oauthv2_token() from scripting.
  const preOAuth2TokenEvent = {
    name: 'auth.oauth2.token.pre',
  };
  return legacyScriptingRunner.runEvent(preOAuth2TokenEvent, z, bundle)
    .then((preOAuth2TokenResult) => z.request(preOAuth2TokenResult))
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(`Unable to fetch access token: ${response.content}`);
      }

      // Do a post_oauthv2_token() from scripting.
      const postOAuth2TokenEvent = {
        name: 'auth.oauth2.token.post',
        response,
      };
      return legacyScriptingRunner.runEvent(postOAuth2TokenEvent, z, bundle);
    });
};
<% } else if (hasPreOAuthTokenScripting && !hasPostOAuthTokenScripting) { %>
const getAccessToken = (z, bundle) => {
  const scripting = require('./scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= ACCESS_TOKEN_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle);

  // Do a pre_oauthv2_token() from scripting.
  const preOAuth2TokenEvent = {
    name: 'auth.oauth2.token.pre',
  };
  return legacyScriptingRunner.runEvent(preOAuth2TokenEvent, z, bundle)
    .then((preOAuth2TokenResult) => z.request(preOAuth2TokenResult))
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(`Unable to fetch access token: ${response.content}`);
      }
      return z.JSON.parse(response.content);
    });
};
<% } else if (!hasPreOAuthTokenScripting && hasPostOAuthTokenScripting) { %>
const getAccessToken = (z, bundle) => {
  const scripting = require('./scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= ACCESS_TOKEN_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle);

  const responsePromise = z.request({
    method: 'POST',
    url: bundle._legacyUrl,
    body: {
      code: bundle.inputData.code,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri: bundle.inputData.redirect_uri,
      grant_type: 'authorization_code',
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  });
  return responsePromise.then((response) => {
    // Do a post_oauthv2_token() from scripting.
    const postOAuth2TokenEvent = {
      name: 'auth.oauth2.token.post',
      response,
    };
    return legacyScriptingRunner.runEvent(postOAuth2TokenEvent, z, bundle);
  });
<% }

   if (withRefresh && hasPreOAuthRefreshScripting) { %>
const refreshAccessToken = (z, bundle) => {
  const scripting = require('./scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= REFRESH_TOKEN_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle);

  // Do a pre_oauthv2_refresh() from scripting.
  const preOAuth2RefreshEvent = {
    name: 'auth.oauth2.refresh.pre',
  };
  return legacyScriptingRunner.runEvent(preOAuth2RefreshEvent, z, bundle)
    .then((preOAuth2RefreshResult) => z.request(preOAuth2RefreshResult))
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(`Unable to fetch access token: ${response.content}`);
      }

      return z.JSON.parse(response.content);
    });
};
<% }

   if (hasGetConnectionLabelScripting) { %>
const getConnectionLabel = (z, bundle) => {
  const scripting = require('./scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  // Do a get_connection_label() from scripting.
  const connectionLabelEvent = {
    name: 'auth.connectionLabel',
  };
  return legacyScriptingRunner.runEvent(connectionLabelEvent, z, bundle);
};
<% } %>
const authentication = {
  // TODO: just an example stub - you'll need to complete
  type: 'oauth2',
  test: testTrigger.operation.perform,
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
<% if (hasPreOAuthTokenScripting || hasPostOAuthTokenScripting) { %>
    getAccessToken: getAccessToken,
<% } else { %>
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
<% }

   if (withRefresh && hasPreOAuthRefreshScripting) { %>
    refreshAccessToken: refreshAccessToken,
<% } else if (withRefresh) { %>
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
<% } %>
    scope: '<%= SCOPE %>',
<% if (withRefresh) { %>
    autoRefresh: true
<% } %>
  },
<% if (hasGetConnectionLabelScripting) { %>
  connectionLabel: getConnectionLabel
<% } else { %>
  connectionLabel: '<%= CONNECTION_LABEL %>'
<% } %>
};

module.exports = authentication;
