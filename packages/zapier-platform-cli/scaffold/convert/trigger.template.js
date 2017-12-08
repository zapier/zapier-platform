// Trigger stub created by 'zapier convert'. This is just a stub - you will need to edit!
const { replaceVars } = require('../utils');
<%
// Template for just _pre_poll()
if (preScripting && !postScripting && !fullScripting) { %>
const getList = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= URL %>';

  // Do a _pre_poll() from scripting.
  const prePollEvent = {
    name: 'trigger.pre',
    key: '<%= KEY %>'
  };
  return legacyScriptingRunner.runEvent(prePollEvent, z, bundle)
    .then((prePollResult) => z.request(prePollResult))
    .then((response) => z.JSON.parse(response.content));
};
<%
}

// Template for _pre_poll() + _post_poll()
if (preScripting && postScripting && !fullScripting) { %>
const getList = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= URL %>';

  // Do a _pre_poll() from scripting.
  const prePollEvent = {
    name: 'trigger.pre',
    key: '<%= KEY %>'
  };
  return legacyScriptingRunner.runEvent(prePollEvent, z, bundle)
    .then((prePollResult) => z.request(prePollResult))
    .then((response) => {
      // Do a _post_poll() from scripting.
      const postPollEvent = {
        name: 'trigger.post',
        key: '<%= KEY %>',
        response
      };
      return legacyScriptingRunner.runEvent(postPollEvent, z, bundle);
    });
};
<%
}

// Template for just _post_poll()
if (!preScripting && postScripting && !fullScripting) { %>
const getList = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= URL %>';

  const responsePromise = z.request({
    url: bundle._legacyUrl
  });
  return responsePromise
    .then((response) => {
      // Do a _post_poll() from scripting.
      const postPollEvent = {
        name: 'trigger.post',
        key: '<%= KEY %>',
        response
      };
      return legacyScriptingRunner.runEvent(postPollEvent, z, bundle);
    });
};
<%
}

// Template for just _poll()
if (fullScripting) { %>
const getList = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= URL %>';

  // Do a _poll() from scripting.
  const fullPollEvent = {
    name: 'trigger.poll',
    key: '<%= KEY %>',
  };
  return legacyScriptingRunner.runEvent(fullPollEvent, z, bundle);
};
<%
}

// If there's no scripting, it's even sweeter and simpler!
if (!preScripting && !postScripting && !fullScripting) { %>
const getList = (z, bundle) => {
  const responsePromise = z.request({
    url: '<%= URL %>'
  });
  return responsePromise
    .then(response => z.JSON.parse(response.content));
};
<% }

if (outputFieldPreScripting && !outputFieldPostScripting) { %>
const getOutputFields = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= CUSTOM_FIELDS_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle, {});

  // Do a _pre_custom_trigger_fields() from scripting.
  const preResultFieldsEvent = {
    name: 'trigger.output.pre',
    key: '<%= KEY %>',
  };
  return legacyScriptingRunner.runEvent(preResultFieldsEvent, z, bundle)
    .then((preResultFieldsResult) => z.request(preResultFieldsResult))
    .then((response) => z.JSON.parse(response.content));
};
<% } else if (outputFieldPreScripting && outputFieldPostScripting) { %>
const getOutputFields = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= CUSTOM_FIELDS_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle, {});

  // Do a _pre_custom_trigger_fields() from scripting.
  const preResultFieldsEvent = {
    name: 'trigger.output.pre',
    key: '<%= KEY %>',
  };
  return legacyScriptingRunner.runEvent(preResultFieldsEvent, z, bundle)
    .then((preResultFieldsResult) => z.request(preResultFieldsResult))
    .then((response) => {
      // Do a _post_custom_trigger_fields() from scripting.
      const postResultFieldsEvent = {
        name: 'trigger.output.post',
        key: '<%= KEY %>',
        response,
      };
      return legacyScriptingRunner.runEvent(postResultFieldsEvent, z, bundle);
    });
};
<% } else if (!outputFieldPreScripting && outputFieldPostScripting) { %>
const getOutputFields = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= CUSTOM_FIELDS_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle, {});

  const responsePromise = z.request({
    url: bundle._legacyUrl
  });
  return responsePromise
    .then((response) => {
      // Do a _post_custom_trigger_fields() from scripting.
      const postResultFieldsEvent = {
        name: 'trigger.output.post',
        key: '<%= KEY %>',
        response,
      };
      return legacyScriptingRunner.runEvent(postResultFieldsEvent, z, bundle);
    });
};
<% } else if (hasCustomOutputFields) { %>
const getOutputFields = (z, bundle) => {
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
<%= FIELDS %>
    ],
    outputFields: [
<%= SAMPLE %><% if (hasCustomOutputFields) { %><% if (SAMPLE) { %>,<% } %>
      getOutputFields<% } %>
    ],
    perform: getList
  }
};
