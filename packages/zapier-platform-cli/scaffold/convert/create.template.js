// "Create" stub created by 'zapier convert'. This is just a stub - you will need to edit!
<%
// Template for just _pre_write()
if (scripting && preScripting && !postScripting && !fullScripting) { %>
const makeRequest = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= URL %>';

  // Do a _pre_write() from scripting.
  const preWriteEvent = {
    name: 'create.pre',
    key: '<%= KEY %>'
  };
  return legacyScriptingRunner.runEvent(preWriteEvent, z, bundle)
    .then((preWriteResult) => z.request(preWriteResult))
    .then((response) => z.JSON.parse(response.content));
};
<%
}

// Template for _pre_write() + _post_write()
if (scripting && preScripting && postScripting && !fullScripting) { %>
const makeRequest = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= URL %>';

  // Do a _pre_write() from scripting.
  const preWriteEvent = {
    name: 'create.pre',
    key: '<%= KEY %>'
  };
  return legacyScriptingRunner.runEvent(preWriteEvent, z, bundle)
    .then((preWriteResult) => z.request(preWriteResult))
    .then((response) => {
      // Do a _post_write() from scripting.
      const postWriteEvent = {
        name: 'create.post',
        key: '<%= KEY %>',
        response
      };
      return legacyScriptingRunner.runEvent(postWriteEvent, z, bundle);
    });
};
<%
}

// Template for just _post_write()
if (scripting && !preScripting && postScripting && !fullScripting) { %>
const makeRequest = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= URL %>';

  const responsePromise = z.request({
    url: bundle._legacyUrl
  });
  return responsePromise
    .then((response) => {
      // Do a _post_write() from scripting.
      const postWriteEvent = {
        name: 'create.post',
        key: '<%= KEY %>',
        response
      };
      return legacyScriptingRunner.runEvent(postWriteEvent, z, bundle);
    });
};
<%
}

// Template for just _write()
if (scripting && fullScripting) { %>
const makeRequest = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= URL %>';

  // Do a _write() from scripting.
  const fullWriteEvent = {
    name: 'create.write',
    key: '<%= KEY %>'
  };
  return legacyScriptingRunner.runEvent(fullWriteEvent, z, bundle);
};
<%
}

// If there's no scripting, it's even sweeter and simpler!
if (!scripting) { %>
const makeRequest = (z, bundle) => {
  const responsePromise = z.request({
    url: '<%= URL %>',
    method: 'POST',
    body: bundle.inputData
  });
  return responsePromise
    .then(response => z.JSON.parse(response.content));
};
<% } %>

module.exports = {
  key: '<%= KEY %>',
  noun: '<%= NOUN %>',

  display: {
    label: '<%= LABEL %>',
    description: '<%= DESCRIPTION %>',
    hidden: <%= HIDDEN %>,
    important: <%= IMPORTANT %>
  },

  operation: {
    inputFields: [
<%= FIELDS %>
    ],
<%= SAMPLE %>
    perform: makeRequest
  }
};
