<% if (customBasic) { %>
const { replaceVars } = require('./utils');
<% } %>
<% if (before && !session && !oauth && !customBasic) { %>const maybeIncludeAuth = (request, z, bundle) => {
<%
  Object.keys(mapping).forEach((mapperKey) => {
    fields.forEach((field) => {
      if (mapping[mapperKey].indexOf(`{{${field}}}`) !== -1) {
        if (query) { %>
  request.params['<%= mapperKey %>'] = bundle.authData['<%= field %>'];
<% } else { %>
  request.headers['<%= mapperKey %>'] = bundle.authData['<%= field %>'];
<%      }
      }
    });
  });
%>
  return request;
};
<% } else if (customBasic) { %>
const maybeIncludeAuth = (request, z, bundle) => {
  const mapping = {
    username: '<%= mapping.username %>',
    password: '<%= mapping.password %>'
  };
  const username = replaceVars(mapping.username, bundle);
  const password = replaceVars(mapping.password, bundle);
  const encoded = Buffer.from(`${username}:${password}`).toString('base64');
  request.headers.Authorization = `Basic ${encoded}`;
  return request;
};
<% }

if (before && session) { %>const maybeIncludeAuth = (request, z, bundle) => {
<%
  if (query) { %>
  request.params['<%= Object.keys(mapping)[0] %>'] = bundle.authData.sessionKey;;
<% } else { %>
  request.headers['<%= Object.keys(mapping)[0] %>'] = bundle.authData.sessionKey;
<% } %>
  return request;
};
<% }

if (before && oauth) { %>const maybeIncludeAuth = (request, z, bundle) => {

  request.headers.Authorization = `Bearer ${bundle.authData.access_token}`;

  return request;
};
<% }

if (after) { %>
const maybeRefresh = (response, z, bundle) => {
  if (response.status === 401 || response.status === 403) {
    throw new z.errors.RefreshAuthError('Session key needs refreshing.');
  }

  return response;
};
<% }

if (session) { %>
const getSessionKey = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  // Do a get_session_info() from scripting.
  const getSessionEvent = {
    name: 'auth.session'
  };
  return legacyScriptingRunner.runEvent(getSessionEvent, z, bundle)
    .then((getSessionResult) => {
      // IMPORTANT NOTE:
      //   WB apps in scripting's get_session_info() allowed you to return any object and that would
      //   be added to the authData, but CLI apps require you to specifically define those.
      //   That means that if you return more than one key from your scripting's get_session_info(),
      //   you might need to manually tweak this method to return that value at the end of this method,
      //   and also add more fields to the authentication definition.

      const resultKeys = Object.keys(getSessionResult);
      const firstKeyValue = (getSessionResult && resultKeys.length > 0) ? getSessionResult[resultKeys[0]] : getSessionResult;

      return {
        sessionKey: firstKeyValue
      };
    });
};
<% } %>
