const testTrigger = require('<%= TEST_TRIGGER_MODULE %>');

const getSessionKey = (z, bundle) => {
  const scripting = require('./scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  // Do a get_session_info() from scripting.
  const getSessionEvent = {
    name: 'auth.session',
  };
  return legacyScriptingRunner.runEvent(getSessionEvent, z, bundle)
    .then((getSessionResult) => {
      // IMPORTANT NOTE:
      //   WB apps in scripting's get_session_info() allowed to return any object and that would be
      //   added to the authData, but CLI apps require you to specifically define those.
      //   That means that if you return more than one key from your scripting's get_session_info(),
      //   you might need to manually tweak this method to return that value at the end of this method,
      //   and also add more fields to the authentication definition.

      const resultKeys = Object.keys(getSessionResult);
      const firstKeyValue = (getSessionResult && resultKeys.length > 0) ? getSessionResult[resultKeys[0]] : getSessionResult;

      return {
        sessionKey: firstKeyValue,
      };
    });
};
<% if (hasGetConnectionLabelScripting) { %>
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
  type: 'session',
  test: testTrigger.operation.perform,
  fields: [
<%= FIELDS %>
  ],
  sessionConfig: {
    perform: getSessionKey
  },
<% if (hasGetConnectionLabelScripting) { %>
  connectionLabel: getConnectionLabel
<% } else { %>
  connectionLabel: '<%= CONNECTION_LABEL %>'
<% } %>
};

module.exports = authentication;
