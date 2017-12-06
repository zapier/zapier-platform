// "Create" stub created by 'zapier convert'. This is just a stub - you will need to edit!
const _ = require('lodash');

// Does string replacement ala WB, using bundle and a potential result object
const replaceVars = (templateString, bundle, result) => {
  _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
  const values = _.extend({}, bundle.authData, bundle.inputData, result);
  return _.template(templateString)(values);
};
<%
// Template for just _pre_write()
if (preScripting && !postScripting && !fullScripting) { %>
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
if (preScripting && postScripting && !fullScripting) { %>
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
if (!preScripting && postScripting && !fullScripting) { %>
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
if (fullScripting) { %>
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
if (!preScripting && !postScripting && !fullScripting) { %>
const makeRequest = (z, bundle) => {
  const responsePromise = z.request({
    url: '<%= URL %>',
    method: 'POST',
    body: bundle.inputData
  });
  return responsePromise
    .then(response => z.JSON.parse(response.content));
};
<% }

if (inputFieldFullScripting) { %>
const getInputFields = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= CUSTOM_FIELDS_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle, {});

  // Do a _custom_action_fields() from scripting.
  const fullFieldsEvent = {
    name: 'create.input',
    key: '<%= KEY %>'
  };
  return legacyScriptingRunner.runEvent(fullFieldsEvent, z, bundle);
};
<% } else if (inputFieldPreScripting && !inputFieldPostScripting) { %>
const getInputFields = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= CUSTOM_FIELDS_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle, {});

  // Do a _pre_custom_action_fields() from scripting.
  const preFieldsEvent = {
    name: 'create.input.pre',
    key: '<%= KEY %>'
  };
  return legacyScriptingRunner.runEvent(preFieldsEvent, z, bundle)
    .then((preFieldsResult) => z.request(preFieldsResult))
    .then((response) => z.JSON.parse(response.content));
};
<% } else if (inputFieldPreScripting && inputFieldPostScripting) { %>
const getInputFields = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= CUSTOM_FIELDS_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle, {});

  // Do a _pre_custom_action_fields() from scripting.
  const preFieldsEvent = {
    name: 'create.input.pre',
    key: '<%= KEY %>'
  };
  return legacyScriptingRunner.runEvent(preFieldsEvent, z, bundle)
    .then((preFieldsResult) => z.request(preFieldsResult))
    .then((response) => {
      // Do a _post_custom_action_fields() from scripting.
      const postFieldsEvent = {
        name: 'create.input.post',
        key: '<%= KEY %>',
        response,
      };
      return legacyScriptingRunner.runEvent(postFieldsEvent, z, bundle);
    });
};
<% } else if (!inputFieldPreScripting && inputFieldPostScripting) { %>
const getInputFields = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= CUSTOM_FIELDS_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle, {});

  const responsePromise = z.request({
    url: bundle._legacyUrl
  });
  return responsePromise
    .then((response) => {
      // Do a _post_custom_action_fields() from scripting.
      const postFieldsEvent = {
        name: 'create.input.post',
        key: '<%= KEY %>',
        response,
      };
      return legacyScriptingRunner.runEvent(postFieldsEvent, z, bundle);
    });
};
<% } else if (hasCustomInputFields) { %>
const getInputFields = (z, bundle) => {
  let url = '<%= CUSTOM_FIELDS_URL %>';
  url = replaceVars(url, bundle, {});

  const responsePromise = z.request({
    url: url
  });
  return responsePromise
    .then((response) => z.JSON.parse(response.content));
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
<%= FIELDS %><% if (hasCustomInputFields) { %><% if (FIELDS) { %>,<% } %>
      getInputFields<% } %>
    ],
<%= SAMPLE %>
    perform: makeRequest
  }
};
