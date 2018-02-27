// "Create" stub created by 'zapier convert'. This is just a stub - you will need to edit!
const { replaceVars } = require('../utils');
<%
// Template for just _pre_write()
if (preScripting && !postScripting && !fullScripting) { %>
const makeRequest = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle);

  // Do a _pre_write() from scripting.
  const preWriteEvent = {
    name: 'create.pre',
    key: '<%= KEY %>'
  };
  return legacyScriptingRunner.runEvent(preWriteEvent, z, bundle)
    .then(preWriteResult => z.request(preWriteResult))
    .then(response => {
      response.throwForStatus();
      return z.JSON.parse(response.content)
    });
};
<%
}

// Template for _pre_write() + _post_write()
if (preScripting && postScripting && !fullScripting) { %>
const makeRequest = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle);

  // Do a _pre_write() from scripting.
  const preWriteEvent = {
    name: 'create.pre',
    key: '<%= KEY %>'
  };
  return legacyScriptingRunner.runEvent(preWriteEvent, z, bundle)
    .then(preWriteResult => z.request(preWriteResult))
    .then(response => {
      response.throwForStatus();

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
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle);

<% if (excludeFieldKeys) { %>
  // Exclude create fields that uncheck "Send to Action Endpoint URL in JSON body"
  // https://zapier.com/developer/documentation/v2/action-fields/#send-to-action-endpoint-url-in-json-body
  <% excludeFieldKeys.forEach(fieldKey => { %>
    delete bundle.inputData['<%= fieldKey %>'];
  <% }); %>
<% } %>

  const responsePromise = z.request({
    url: bundle._legacyUrl,
    method: 'POST',
    body: bundle.inputData
  });
  return responsePromise
    .then(response => {
      response.throwForStatus();

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
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle);

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
  let url = '<%= URL %>';
  url = replaceVars(url, bundle);

<% if (excludeFieldKeys) { %>
  // Exclude create fields that uncheck "Send to Action Endpoint URL in JSON body"
  // https://zapier.com/developer/documentation/v2/action-fields/#send-to-action-endpoint-url-in-json-body
  <% excludeFieldKeys.forEach(fieldKey => { %>
    delete bundle.inputData['<%= fieldKey %>'];
  <% }); %>
<% } %>

  const responsePromise = z.request({
    url: url,
    method: 'POST',
    body: bundle.inputData
  });
  return responsePromise.then(response => {
    response.throwForStatus();
    return z.JSON.parse(response.content);
  });
};
<% }

if (inputFieldFullScripting) { %>
const getInputFields = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= CUSTOM_FIELDS_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle);

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
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle);

  // Do a _pre_custom_action_fields() from scripting.
  const preFieldsEvent = {
    name: 'create.input.pre',
    key: '<%= KEY %>'
  };
  return legacyScriptingRunner.runEvent(preFieldsEvent, z, bundle)
    .then(preFieldsResult => z.request(preFieldsResult))
    .then(response => {
      response.throwForStatus();
      return z.JSON.parse(response.content);
    });
};
<% } else if (inputFieldPreScripting && inputFieldPostScripting) { %>
const getInputFields = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= CUSTOM_FIELDS_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle);

  // Do a _pre_custom_action_fields() from scripting.
  const preFieldsEvent = {
    name: 'create.input.pre',
    key: '<%= KEY %>'
  };
  return legacyScriptingRunner.runEvent(preFieldsEvent, z, bundle)
    .then(preFieldsResult => z.request(preFieldsResult))
    .then(response => {
      response.throwForStatus();

      // Do a _post_custom_action_fields() from scripting.
      const postFieldsEvent = {
        name: 'create.input.post',
        key: '<%= KEY %>',
        response
      };
      return legacyScriptingRunner.runEvent(postFieldsEvent, z, bundle);
    });
};
<% } else if (!inputFieldPreScripting && inputFieldPostScripting) { %>
const getInputFields = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= CUSTOM_FIELDS_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle);

  const responsePromise = z.request({
    url: bundle._legacyUrl
  });
  return responsePromise
    .then(response => {
      response.throwForStatus();

      // Do a _post_custom_action_fields() from scripting.
      const postFieldsEvent = {
        name: 'create.input.post',
        key: '<%= KEY %>',
        response
      };
      return legacyScriptingRunner.runEvent(postFieldsEvent, z, bundle);
    });
};
<% } else if (hasCustomInputFields) { %>
const getInputFields = (z, bundle) => {
  let url = '<%= CUSTOM_FIELDS_URL %>';
  url = replaceVars(url, bundle);

  const responsePromise = z.request({
    url: url
  });
  return responsePromise.then(response => {
    response.throwForStatus();
    return z.JSON.parse(response.content);
  });
};
<% }

if (outputFieldFullScripting) {%>
const getOutputFields = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= CUSTOM_FIELDS_RESULT_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle);

  // Do a _custom_action_result_fields() from scripting.
  const fullResultFieldsEvent = {
    name: 'create.output',
    key: '<%= KEY %>'
  };
  return legacyScriptingRunner.runEvent(fullResultFieldsEvent, z, bundle);
};
<% } else if (outputFieldPreScripting && !outputFieldPostScripting) { %>
const getOutputFields = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= CUSTOM_FIELDS_RESULT_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle);

  // Do a _pre_custom_action_result_fields() from scripting.
  const preResultFieldsEvent = {
    name: 'create.output.pre',
    key: '<%= KEY %>'
  };
  return legacyScriptingRunner.runEvent(preResultFieldsEvent, z, bundle)
    .then(preResultFieldsResult => z.request(preResultFieldsResult))
    .then(response => {
      response.throwForStatus();
      return z.JSON.parse(response.content);
    });
};
<% } else if (outputFieldPreScripting && outputFieldPostScripting) { %>
const getOutputFields = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= CUSTOM_FIELDS_RESULT_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle);

  // Do a _pre_custom_action_result_fields() from scripting.
  const preResultFieldsEvent = {
    name: 'create.output.pre',
    key: '<%= KEY %>'
  };
  return legacyScriptingRunner.runEvent(preResultFieldsEvent, z, bundle)
    .then(preResultFieldsResult => z.request(preResultFieldsResult))
    .then(response => {
      response.throwForStatus();

      // Do a _post_custom_action_result_fields() from scripting.
      const postResultFieldsEvent = {
        name: 'create.output.post',
        key: '<%= KEY %>',
        response
      };
      return legacyScriptingRunner.runEvent(postResultFieldsEvent, z, bundle);
    });
};
<% } else if (!outputFieldPreScripting && outputFieldPostScripting) { %>
const getOutputFields = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= CUSTOM_FIELDS_RESULT_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle);

  const responsePromise = z.request({
    url: bundle._legacyUrl
  });
  return responsePromise.then(response => {
    response.throwForStatus();

    // Do a _post_custom_action_result_fields() from scripting.
    const postResultFieldsEvent = {
      name: 'create.output.post',
      key: '<%= KEY %>',
      response
    };
    return legacyScriptingRunner.runEvent(postResultFieldsEvent, z, bundle);
  });
};
<% } else if (hasCustomOutputFields) { %>
const getOutputFields = (z, bundle) => {
  let url = '<%= CUSTOM_FIELDS_RESULT_URL %>';
  url = replaceVars(url, bundle);

  const responsePromise = z.request({
    url: url
  });
  return responsePromise.then(response => {
    response.throwForStatus();
    return z.JSON.parse(response.content);
  });
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
    outputFields: [
<%= SAMPLE %><% if (hasCustomOutputFields) { %><% if (SAMPLE) { %>,<% } %>
      getOutputFields<% } %>
    ],
    perform: makeRequest
  }
};
