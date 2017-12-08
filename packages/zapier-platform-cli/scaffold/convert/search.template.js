// Search stub created by 'zapier convert'. This is just a stub - you will need to edit!
const _ = require('lodash');
const { replaceVars } = require('../utils');
<%
// Template for just _pre_search()
if (preScripting && !postScripting && !fullScripting) { %>
const getList = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  // We're cloning bundle to re-use it when mimicking a "fetch resource" that happened in WB
  const resourceBundle = _.cloneDeep(bundle);

  bundle._legacyUrl = '<%= URL %>';
  resourceBundle._legacyUrl = '<%= RESOURCE_URL %>';

  // Do a _pre_search() from scripting.
  const preSearchEvent = {
    name: 'search.pre',
    key: '<%= KEY %>'
  };
  return legacyScriptingRunner.runEvent(preSearchEvent, z, bundle)
    .then((preSearchResult) => z.request(preSearchResult))
<% if (resourceFullScripting) { %>
    .then((response) => {
      const results = z.JSON.parse(response.content);

      // Do a _read_resource() from scripting.
      const fullResourceEvent = {
        name: 'search.resource',
        key: '<%= KEY %>',
        results,
      };
      return legacyScriptingRunner.runEvent(fullResourceEvent, z, resourceBundle);
    })
    .then((results) => {
      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } else if (resourcePreScripting && resourcePostScripting) { %>
    .then((response) => {
      // Mimick the "fetch resource" that happened in WB
      const results = z.JSON.parse(response.content);

      // Do a _pre_read_resource() from scripting.
      const preResourceEvent = {
        name: 'search.resource.pre',
        key: '<%= KEY %>',
        results,
      };
      resourceBundle._legacyUrl = replaceVars(resourceBundle._legacyUrl, resourceBundle, _.get(results, '[0]', {}));
      return legacyScriptingRunner.runEvent(preResourceEvent, z, resourceBundle);
    })
    .then((preResourceResult) => z.request(preResourceResult))
    .then((response) => {
      // Do a _post_read_resource() from scripting.
      const postResourceEvent = {
        name: 'search.resource.post',
        key: '<%= KEY %>',
        response,
        results: resourceBundle.results,
      };
      return legacyScriptingRunner.runEvent(postResourceEvent, z, resourceBundle);
    })
    .then((results) => {
      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } else if (resourcePreScripting) { %>
    .then((response) => {
      // Mimick the "fetch resource" that happened in WB
      const results = z.JSON.parse(response.content);

      // Do a _pre_read_resource() from scripting.
      const preResourceEvent = {
        name: 'search.resource.pre',
        key: '<%= KEY %>',
        results,
      };
      resourceBundle._legacyUrl = replaceVars(resourceBundle._legacyUrl, resourceBundle, _.get(results, '[0]', {}));
      return legacyScriptingRunner.runEvent(preResourceEvent, z, resourceBundle);
    })
    .then((preResourceResult) => z.request(preResourceResult))
    .then((response) => {
      const results = z.JSON.parse(response.content);

      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } else if (resourcePostScripting) { %>
    .then((response) => {
      // Mimick the "fetch resource" that happened in WB
      const results = z.JSON.parse(response.content);

      if (!results || results.length === 0) {
        return response;
      }

      resourceBundle.results = results;

      const finalUrl = replaceVars(resourceBundle._legacyUrl, resourceBundle, results[0]);
      return z.request({ url: finalUrl });
    })
    .then((response) => {
      // Do a _post_read_resource() from scripting.
      const postResourceEvent = {
        name: 'search.resource.post',
        key: '<%= KEY %>',
        response,
        results: resourceBundle.results,
      };
      return legacyScriptingRunner.runEvent(postResourceEvent, z, resourceBundle);
    })
    .then((results) => {
      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } else { %>
    .then((response) => {
      // Mimick the "fetch resource" that happened in WB
      const results = z.JSON.parse(response.content);

      if (!results || results.length === 0) {
        return response;
      }

      const finalUrl = replaceVars(resourceBundle._legacyUrl, resourceBundle, results[0]);
      return z.request({ url: finalUrl });
    })
    .then((response) => {
      const results = z.JSON.parse(response.content);

      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } %>
};
<%
}

// Template for _pre_search() + _post_search()
if (preScripting && postScripting && !fullScripting) { %>
const getList = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  // We're cloning bundle to re-use it when mimicking a "fetch resource" that happened in WB
  const resourceBundle = _.cloneDeep(bundle);

  bundle._legacyUrl = '<%= URL %>';
  resourceBundle._legacyUrl = '<%= RESOURCE_URL %>';

  // Do a _pre_search() from scripting.
  const preSearchEvent = {
    name: 'search.pre',
    key: '<%= KEY %>'
  };
  return legacyScriptingRunner.runEvent(preSearchEvent, z, bundle)
    .then((preSearchResult) => z.request(preSearchResult))
    .then((response) => {
      // Do a _post_search() from scripting.
      const postSearchEvent = {
        name: 'search.post',
        key: '<%= KEY %>',
        response
      };
      return legacyScriptingRunner.runEvent(postSearchEvent, z, bundle);
    })
<% if (resourceFullScripting) { %>
    .then((postSearchResult) => {
      const results = postSearchResult;

      // Do a _read_resource() from scripting.
      const fullResourceEvent = {
        name: 'search.resource',
        key: '<%= KEY %>',
        results,
      };
      return legacyScriptingRunner.runEvent(fullResourceEvent, z, resourceBundle);
    })
    .then((results) => {
      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } else if (resourcePreScripting && resourcePostScripting) { %>
    .then((postSearchResult) => {
      // Mimick the "fetch resource" that happened in WB
      const results = postSearchResult;

      // Do a _pre_read_resource() from scripting.
      const preResourceEvent = {
        name: 'search.resource.pre',
        key: '<%= KEY %>',
        results,
      };
      resourceBundle._legacyUrl = replaceVars(resourceBundle._legacyUrl, resourceBundle, _.get(results, '[0]', {}));
      return legacyScriptingRunner.runEvent(preResourceEvent, z, resourceBundle);
    })
    .then((preResourceResult) => z.request(preResourceResult))
    .then((response) => {
      // Do a _post_read_resource() from scripting.
      const postResourceEvent = {
        name: 'search.resource.post',
        key: '<%= KEY %>',
        response,
        results: resourceBundle.results,
      };
      return legacyScriptingRunner.runEvent(postResourceEvent, z, resourceBundle);
    })
    .then((results) => {
      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } else if (resourcePreScripting) { %>
    .then((postSearchResult) => {
      // Mimick the "fetch resource" that happened in WB
      const results = postSearchResult;

      // Do a _pre_read_resource() from scripting.
      const preResourceEvent = {
        name: 'search.resource.pre',
        key: '<%= KEY %>',
        results,
      };
      resourceBundle._legacyUrl = replaceVars(resourceBundle._legacyUrl, resourceBundle, _.get(results, '[0]', {}));
      return legacyScriptingRunner.runEvent(preResourceEvent, z, resourceBundle);
    })
    .then((preResourceResult) => z.request(preResourceResult))
    .then((response) => {
      const results = z.JSON.parse(response.content);

      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } else if (resourcePostScripting) { %>
    .then((postSearchResult) => {
      // Mimick the "fetch resource" that happened in WB
      const results = postSearchResult;

      resourceBundle.results = results;

      const finalUrl = replaceVars(resourceBundle._legacyUrl, resourceBundle, _.get(results, '[0]', {}));
      return z.request({ url: finalUrl });
    })
    .then((response) => {
      // Do a _post_read_resource() from scripting.
      const postResourceEvent = {
        name: 'search.resource.post',
        key: '<%= KEY %>',
        response,
        results: resourceBundle.results,
      };
      return legacyScriptingRunner.runEvent(postResourceEvent, z, resourceBundle);
    })
    .then((results) => {
      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } else { %>
    .then((postSearchResult) => {
      // Mimick the "fetch resource" that happened in WB
      if (!postSearchResult || postSearchResult.length === 0) {
        return {
          content: '[]',
        };
      }

      const finalUrl = replaceVars(resourceBundle._legacyUrl, resourceBundle, postSearchResult[0]);
      return z.request({ url: finalUrl });
    })
    .then((response) => {
      const results = z.JSON.parse(response.content);

      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } %>
};
<%
}

// Template for just _post_search()
if (!preScripting && postScripting && !fullScripting) { %>
const getList = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  // We're cloning bundle to re-use it when mimicking a "fetch resource" that happened in WB
  const resourceBundle = _.cloneDeep(bundle);

  bundle._legacyUrl = '<%= URL %>';
  resourceBundle._legacyUrl = '<%= RESOURCE_URL %>';

  const responsePromise = z.request({
    url: bundle._legacyUrl
  });
  return responsePromise
    .then((response) => {
      // Do a _post_search() from scripting.
      const postSearchEvent = {
        name: 'search.post',
        key: '<%= KEY %>',
        response
      };
      return legacyScriptingRunner.runEvent(postSearchEvent, z, bundle);
    })
<% if (resourceFullScripting) { %>
    .then((postSearchResult) => {
      const results = postSearchResult;

      // Do a _read_resource() from scripting.
      const fullResourceEvent = {
        name: 'search.resource',
        key: '<%= KEY %>',
        results,
      };
      return legacyScriptingRunner.runEvent(fullResourceEvent, z, resourceBundle);
    })
    .then((results) => {
      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } else if (resourcePreScripting && resourcePostScripting) { %>
    .then((postSearchResult) => {
      // Mimick the "fetch resource" that happened in WB
      const results = postSearchResult;

      // Do a _pre_read_resource() from scripting.
      const preResourceEvent = {
        name: 'search.resource.pre',
        key: '<%= KEY %>',
        results,
      };
      resourceBundle._legacyUrl = replaceVars(resourceBundle._legacyUrl, resourceBundle, _.get(results, '[0]', {}));
      return legacyScriptingRunner.runEvent(preResourceEvent, z, resourceBundle);
    })
    .then((preResourceResult) => z.request(preResourceResult))
    .then((response) => {
      // Do a _post_read_resource() from scripting.
      const postResourceEvent = {
        name: 'search.resource.post',
        key: '<%= KEY %>',
        response,
        results: resourceBundle.results,
      };
      return legacyScriptingRunner.runEvent(postResourceEvent, z, resourceBundle);
    })
    .then((results) => {
      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } else if (resourcePreScripting) { %>
    .then((postSearchResult) => {
      // Mimick the "fetch resource" that happened in WB
      const results = postSearchResult;

      // Do a _pre_read_resource() from scripting.
      const preResourceEvent = {
        name: 'search.resource.pre',
        key: '<%= KEY %>',
        results,
      };
      resourceBundle._legacyUrl = replaceVars(resourceBundle._legacyUrl, resourceBundle, _.get(results, '[0]', {}));
      return legacyScriptingRunner.runEvent(preResourceEvent, z, resourceBundle);
    })
    .then((preResourceResult) => z.request(preResourceResult))
    .then((response) => {
      const results = z.JSON.parse(response.content);

      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } else if (resourcePostScripting) { %>
    .then((postSearchResult) => {
      // Mimick the "fetch resource" that happened in WB
      const results = postSearchResult;

      resourceBundle.results = results;

      const finalUrl = replaceVars(resourceBundle._legacyUrl, resourceBundle, _.get(results, '[0]', {}));
      return z.request({ url: finalUrl });
    })
    .then((response) => {
      // Do a _post_read_resource() from scripting.
      const postResourceEvent = {
        name: 'search.resource.post',
        key: '<%= KEY %>',
        response,
        results: resourceBundle.results,
      };
      return legacyScriptingRunner.runEvent(postResourceEvent, z, resourceBundle);
    })
    .then((results) => {
      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } else { %>
    .then((postSearchResult) => {
      // Mimick the "fetch resource" that happened in WB
      if (!postSearchResult || postSearchResult.length === 0) {
        return {
          content: '[]',
        };
      }

      const finalUrl = replaceVars(resourceBundle._legacyUrl, resourceBundle, postSearchResult[0]);
      return z.request({ url: finalUrl });
    })
    .then((response) => {
      const results = z.JSON.parse(response.content);

      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } %>
};
<%
}

// Template for just _search()
if (fullScripting) { %>
const getList = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  // We're cloning bundle to re-use it when mimicking a "fetch resource" that happened in WB
  const resourceBundle = _.cloneDeep(bundle);

  bundle._legacyUrl = '<%= URL %>';
  resourceBundle._legacyUrl = '<%= RESOURCE_URL %>';

  // Do a _search() from scripting.
  const fullSearchEvent = {
    name: 'search.search',
    key: '<%= KEY %>',
  };
  return legacyScriptingRunner.runEvent(fullSearchEvent, z, bundle)
<% if (resourceFullScripting) { %>
    .then((fullSearchResult) => {
      const results = fullSearchResult;

      // Do a _read_resource() from scripting.
      const fullResourceEvent = {
        name: 'search.resource',
        key: '<%= KEY %>',
        results,
      };
      return legacyScriptingRunner.runEvent(fullResourceEvent, z, resourceBundle);
    })
    .then((results) => {
      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } else if (resourcePreScripting && resourcePostScripting) { %>
    .then((fullSearchResult) => {
      // Mimick the "fetch resource" that happened in WB
      const results = fullSearchResult;

      // Do a _pre_read_resource() from scripting.
      const preResourceEvent = {
        name: 'search.resource.pre',
        key: '<%= KEY %>',
        results,
      };
      resourceBundle._legacyUrl = replaceVars(resourceBundle._legacyUrl, resourceBundle, _.get(results, '[0]', {}));
      return legacyScriptingRunner.runEvent(preResourceEvent, z, resourceBundle);
    })
    .then((preResourceResult) => z.request(preResourceResult))
    .then((response) => {
      // Do a _post_read_resource() from scripting.
      const postResourceEvent = {
        name: 'search.resource.post',
        key: '<%= KEY %>',
        response,
        results: resourceBundle.results,
      };
      return legacyScriptingRunner.runEvent(postResourceEvent, z, resourceBundle);
    })
    .then((results) => {
      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } else if (resourcePreScripting) { %>
    .then((fullSearchResult) => {
      // Mimick the "fetch resource" that happened in WB
      const results = fullSearchResult;

      // Do a _pre_read_resource() from scripting.
      const preResourceEvent = {
        name: 'search.resource.pre',
        key: '<%= KEY %>',
        results,
      };
      resourceBundle._legacyUrl = replaceVars(resourceBundle._legacyUrl, resourceBundle, _.get(results, '[0]', {}));
      return legacyScriptingRunner.runEvent(preResourceEvent, z, resourceBundle);
    })
    .then((preResourceResult) => z.request(preResourceResult))
    .then((response) => {
      const results = z.JSON.parse(response.content);

      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } else if (resourcePostScripting) { %>
    .then((fullSearchResult) => {
      // Mimick the "fetch resource" that happened in WB
      const results = fullSearchResult;

      resourceBundle.results = results;

      const finalUrl = replaceVars(resourceBundle._legacyUrl, resourceBundle, _.get(results, '[0]', {}));
      return z.request({ url: finalUrl });
    })
    .then((response) => {
      // Do a _post_read_resource() from scripting.
      const postResourceEvent = {
        name: 'search.resource.post',
        key: '<%= KEY %>',
        response,
        results: resourceBundle.results,
      };
      return legacyScriptingRunner.runEvent(postResourceEvent, z, resourceBundle);
    })
    .then((results) => {
      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } else { %>
    .then((fullSearchResult) => {
      // Mimick the "fetch resource" that happened in WB
      if (!fullSearchResult || fullSearchResult.length === 0) {
        return {
          content: '[]',
        };
      }

      const finalUrl = replaceVars(resourceBundle._legacyUrl, resourceBundle, fullSearchResult[0]);
      return z.request({ url: finalUrl });
    })
    .then((response) => {
      const results = z.JSON.parse(response.content);

      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } %>
};
<%
}

// If there's no scripting, it's even sweeter and simpler!
if (!fullScripting && !preScripting && !postScripting) { %>
const getList = (z, bundle) => {
<% if (scripting) { %>
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);
<% } %>
  // We're cloning bundle to re-use it when mimicking a "fetch resource" that happened in WB
  const resourceBundle = _.cloneDeep(bundle);

  bundle._legacyUrl = '<%= URL %>';
  resourceBundle._legacyUrl = '<%= RESOURCE_URL %>';

  const responsePromise = z.request({
    url: bundle._legacyUrl
  });
  return responsePromise
<% if (resourceFullScripting) { %>
    .then((response) => {
      const results = z.JSON.parse(response.content);

      // Do a _read_resource() from scripting.
      const fullResourceEvent = {
        name: 'search.resource',
        key: '<%= KEY %>',
        results,
      };
      return legacyScriptingRunner.runEvent(fullResourceEvent, z, resourceBundle);
    })
    .then((results) => {
      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } else if (resourcePreScripting && resourcePostScripting) { %>
    .then((response) => {
      // Mimick the "fetch resource" that happened in WB
      const results = z.JSON.parse(response.content);

      // Do a _pre_read_resource() from scripting.
      const preResourceEvent = {
        name: 'search.resource.pre',
        key: '<%= KEY %>',
        results,
      };
      resourceBundle._legacyUrl = replaceVars(resourceBundle._legacyUrl, resourceBundle, _.get(results, '[0]', {}));
      return legacyScriptingRunner.runEvent(preResourceEvent, z, resourceBundle);
    })
    .then((preResourceResult) => z.request(preResourceResult))
    .then((response) => {
      // Do a _post_read_resource() from scripting.
      const postResourceEvent = {
        name: 'search.resource.post',
        key: '<%= KEY %>',
        response,
        results: resourceBundle.results,
      };
      return legacyScriptingRunner.runEvent(postResourceEvent, z, resourceBundle);
    })
    .then((results) => {
      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } else if (resourcePreScripting) { %>
    .then((response) => {
      // Mimick the "fetch resource" that happened in WB
      const results = z.JSON.parse(response.content);

      // Do a _pre_read_resource() from scripting.
      const preResourceEvent = {
        name: 'search.resource.pre',
        key: '<%= KEY %>',
        results,
      };
      resourceBundle._legacyUrl = replaceVars(resourceBundle._legacyUrl, resourceBundle, _.get(results, '[0]', {}));
      return legacyScriptingRunner.runEvent(preResourceEvent, z, resourceBundle);
    })
    .then((preResourceResult) => z.request(preResourceResult))
    .then((response) => {
      const results = z.JSON.parse(response.content);

      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } else if (resourcePostScripting) { %>
    .then((response) => {
      // Mimick the "fetch resource" that happened in WB
      const results = z.JSON.parse(response.content);

      if (!results || results.length === 0) {
        return response;
      }

      resourceBundle.results = results;

      const finalUrl = replaceVars(resourceBundle._legacyUrl, resourceBundle, results[0]);
      return z.request({ url: finalUrl });
    })
    .then((response) => {
      // Do a _post_read_resource() from scripting.
      const postResourceEvent = {
        name: 'search.resource.post',
        key: '<%= KEY %>',
        response,
        results: resourceBundle.results,
      };
      return legacyScriptingRunner.runEvent(postResourceEvent, z, resourceBundle);
    })
    .then((results) => {
      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } else { %>
    .then((response) => {
      // Mimick the "fetch resource" that happened in WB
      const results = z.JSON.parse(response.content);

      if (!results || results.length === 0) {
        return response;
      }

      const finalUrl = replaceVars(resourceBundle._legacyUrl, resourceBundle, results[0]);
      return z.request({ url: finalUrl });
    })
    .then((response) => {
      const results = z.JSON.parse(response.content);

      // WB would return a single record, but in CLI we expect an array
      if (_.isArray(results)) {
        return results;
      } else {
        return [results];
      }
    });
<% } %>
};
<% }

if (inputFieldFullScripting) { %>
const getInputFields = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= CUSTOM_FIELDS_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle, {});

  // Do a _custom_search_fields() from scripting.
  const fullFieldsEvent = {
    name: 'search.input',
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

  // Do a _pre_custom_search_fields() from scripting.
  const preFieldsEvent = {
    name: 'search.input.pre',
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

  // Do a _pre_custom_search_fields() from scripting.
  const preFieldsEvent = {
    name: 'search.input.pre',
    key: '<%= KEY %>'
  };
  return legacyScriptingRunner.runEvent(preFieldsEvent, z, bundle)
    .then((preFieldsResult) => z.request(preFieldsResult))
    .then((response) => {
      // Do a _post_custom_search_fields() from scripting.
      const postFieldsEvent = {
        name: 'search.input.post',
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
      // Do a _post_custom_search_fields() from scripting.
      const postFieldsEvent = {
        name: 'search.input.post',
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
<% }

if (outputFieldFullScripting) {%>
const getOutputFields = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= CUSTOM_FIELDS_RESULT_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle, {});

  // Do a _custom_search_result_fields() from scripting.
  const fullResultFieldsEvent = {
    name: 'search.output',
    key: '<%= KEY %>',
  };
  return legacyScriptingRunner.runEvent(fullResultFieldsEvent, z, bundle);
};
<% } else if (outputFieldPreScripting && !outputFieldPostScripting) { %>
const getOutputFields = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  bundle._legacyUrl = '<%= CUSTOM_FIELDS_RESULT_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle, {});

  // Do a _pre_custom_search_result_fields() from scripting.
  const preResultFieldsEvent = {
    name: 'search.output.pre',
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

  bundle._legacyUrl = '<%= CUSTOM_FIELDS_RESULT_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle, {});

  // Do a _pre_custom_search_result_fields() from scripting.
  const preResultFieldsEvent = {
    name: 'search.output.pre',
    key: '<%= KEY %>',
  };
  return legacyScriptingRunner.runEvent(preResultFieldsEvent, z, bundle)
    .then((preResultFieldsResult) => z.request(preResultFieldsResult))
    .then((response) => {
      // Do a _post_custom_search_result_fields() from scripting.
      const postResultFieldsEvent = {
        name: 'search.output.post',
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

  bundle._legacyUrl = '<%= CUSTOM_FIELDS_RESULT_URL %>';
  bundle._legacyUrl = replaceVars(bundle._legacyUrl, bundle, {});

  const responsePromise = z.request({
    url: bundle._legacyUrl
  });
  return responsePromise
    .then((response) => {
      // Do a _post_custom_search_result_fields() from scripting.
      const postResultFieldsEvent = {
        name: 'search.output.post',
        key: '<%= KEY %>',
        response,
      };
      return legacyScriptingRunner.runEvent(postResultFieldsEvent, z, bundle);
    });
};
<% } else if (hasCustomOutputFields) { %>
const getOutputFields = (z, bundle) => {
  let url = '<%= CUSTOM_FIELDS_RESULT_URL %>';
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
    outputFields: [
<%= SAMPLE %><% if (hasCustomOutputFields) { %><% if (SAMPLE) { %>,<% } %>
      getOutputFields<% } %>
    ],
    perform: getList
  }
};
