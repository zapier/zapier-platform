<% if (TEST_TRIGGER_MODULE) { %>
const testTrigger = require('<%= TEST_TRIGGER_MODULE %>');
<% } %>
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
  type: '<%= TYPE %>',
<% if (TEST_TRIGGER_MODULE) { %>
  test: testTrigger.operation.perform,
<% } %>
  fields: [
<%= FIELDS %>
  ],
<% if (hasGetConnectionLabelScripting) { %>
  connectionLabel: getConnectionLabel
<% } else { %>
  connectionLabel: '<%= CONNECTION_LABEL %>'
<% } %>
};

module.exports = authentication;
