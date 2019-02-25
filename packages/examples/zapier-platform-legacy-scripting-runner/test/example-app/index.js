const { AUTH_JSON_SERVER_URL } = require('../auth-json-server');

const legacyScriptingSource = `
    var Zap = {
      getUser: function(bundle) {
        var response = z.request({
          url: '${AUTH_JSON_SERVER_URL}/users',
          params: { id: bundle.userId },
          headers: { 'X-Api-Key': bundle.auth_fields.api_key }
        });
        const users = z.JSON.parse(response.content);
        return users.length > 0 ? users[0] : null;
      },

      get_session_info: function(bundle) {
        var encodedCredentials = btoa(bundle.auth_fields.username + ':' + bundle.auth_fields.password);
        var response = z.request({
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': 'Basic ' + encodedCredentials
          },
          url: '${AUTH_JSON_SERVER_URL}/me'
        });

        if (response.status_code !== 200) {
          throw new HaltedException('Auth failed: ' + response.content);
        }

        // Endpoint /me doesn't really give us an API key. We're just
        // simulating username/password login in exchange of an API key here.
        return {
          key1: 'sec',
          key2: 'ret'
        };
      },

      pre_oauthv2_token: function(bundle) {
        bundle.request.url += 'token';
        return bundle.request;
      },

      post_oauthv2_token: function(bundle) {
        var data = z.JSON.parse(bundle.response.content);
        data.something_custom += '!!';
        data.name = 'Jane Doe';
        return data;
      },

      pre_oauthv2_refresh_auth_json_server: function(bundle) {
        bundle.request.url += 'token';
        return bundle.request;
      },

      pre_oauthv2_refresh_httpbin_form: function(bundle) {
        bundle.request.url = 'https://zapier-httpbin.herokuapp.com/post';
        return bundle.request;
      },

      pre_oauthv2_refresh_httpbin_json: function(bundle) {
        bundle.request.url = 'https://zapier-httpbin.herokuapp.com/post';
        bundle.request.headers['Content-Type'] = 'application/json';
        return bundle.request;
      },

      pre_oauthv2_refresh_request_data: function(bundle) {
        'use strict';

        // bundle.request.data should be an object, so this would error in
        // strict mode if request.data is a string
        bundle.request.data.foo = 'hello';
        bundle.request.data.bar = 'world';
        bundle.request.data = $.param(bundle.request.data);

        bundle.request.headers['Content-Type'] = 'application/x-www-form-urlencoded';

        return {
          url: 'https://zapier-httpbin.herokuapp.com/post',
          method: bundle.request.method,
          headers: bundle.request.headers,
          data: bundle.request.data
        };
      },

      get_connection_label: function(bundle) {
        return 'Hi ' + bundle.test_result.name;
      },

      /*
       * Polling Trigger
       */

      contact_full_poll: function(bundle) {
        bundle.request.url = '${AUTH_JSON_SERVER_URL}/users';
        var response = z.request(bundle.request);
        var contacts = z.JSON.parse(response.content);
        contacts[0].name = 'Patched by KEY_poll!';
        contacts[0].zapTitle = bundle.zap.name;
        return contacts;
      },

      contact_full_pre_custom_trigger_fields: function(bundle) {
        bundle.request.url += 's';
        return bundle.request;
      },

      contact_full_post_custom_trigger_fields: function(bundle) {
        var fields = z.JSON.parse(bundle.response.content);
        fields.push({
          key: 'spin',
          label: 'Spin',
          type: 'string'
        });
        return fields;
      },

      contact_pre_pre_poll: function(bundle) {
        bundle.request.url = '${AUTH_JSON_SERVER_URL}/users';
        bundle.request.params.id = 3;
        return bundle.request;
      },

      contact_post_post_poll: function(bundle) {
        var contacts = z.JSON.parse(bundle.response.content);
        contacts[0].name = 'Patched by KEY_post_poll!';
        contacts[0].jqueryText = $('<div>jQuery works!</div>').text();
        contacts[0].jqueryParam = $.param({width: 1680, height: 1050});
        return contacts;
      },

      contact_pre_post_pre_poll: function(bundle) {
        bundle.request.url = '${AUTH_JSON_SERVER_URL}/users';
        bundle.request.params.id = 4;
        return bundle.request;
      },

      contact_pre_post_post_poll: function(bundle) {
        var contacts = z.JSON.parse(bundle.response.content);
        contacts[0].name = 'Patched by KEY_pre_poll & KEY_post_poll!';
        return contacts;
      },

      /*
       * Hook Trigger
       */

      // To be replaced to 'contact_hook_scripting_catch_hook' at runtime
      contact_hook_scripting_catch_hook_returning_object: function(bundle) {
        var result = bundle.cleaned_request;
        result.luckyNumber = 777;
        return result;
      },

      // To be replaced to 'contact_hook_scripting_catch_hook' at runtime
      contact_hook_scripting_catch_hook_returning_array: function(bundle) {
        var results = bundle.cleaned_request;
        for (const contact of results) {
          contact.luckyNumber = contact.id * 10;
        }
        return results;
      },

      // To be replaced with 'contact_hook_scripting_pre_hook' at runtime to enable
      contact_hook_scripting_pre_hook_disabled: function(bundle) {
        bundle.request.url = bundle.request.url.replace('/users/', '/movies/');
        return bundle.request;
      },

      // To be replaced with 'contact_hook_scripting_post_hook' at runtime to enable
      contact_hook_scripting_post_hook_returning_object: function(bundle) {
        var thing = z.JSON.parse(bundle.response.content);
        thing.year = 2018;
        return thing;
      },

      // To be replaced with 'contact_hook_scripting_post_hook' at runtime to enable
      contact_hook_scripting_post_hook_returning_array: function(bundle) {
        var thing = z.JSON.parse(bundle.response.content);
        thing.year = 2017;

        var anotherThing = {
          id: 5555,
          name: 'The Thing',
          year: 2016
        };

        return [thing, anotherThing];
      },

      pre_subscribe: function(bundle) {
        var data = z.JSON.parse(bundle.request.data);
        data.hidden_message = 'pre_subscribe was here!';

        // Just to make sure these are in bundle
        data.bundleAuthFields = bundle.auth_fields;
        data.bundleTriggerFields = bundle.trigger_fields;
        data.bundleTargetUrl = bundle.target_url;
        data.bundleEvent = bundle.event;
        data.bundleZap = bundle.zap;

        bundle.request.data = z.JSON.stringify(data);
        return bundle.request;
      },

      post_subscribe: function(bundle) {
        // This will go to bundle.subscribe_data in pre_unsubscribe
        var data = z.JSON.parse(bundle.response.content);
        data.hiddenMessage = 'post_subscribe was here!';
        return data;
      },

      pre_unsubscribe: function(bundle) {
        var data = z.JSON.parse(bundle.request.data);
        data.hidden_message = 'pre_unsubscribe was here!';

        // Just to make sure these are in bundle
        data.bundleAuthFields = bundle.auth_fields;
        data.bundleTriggerFields = bundle.trigger_fields;
        data.bundleTargetUrl = bundle.target_url;
        data.bundleSubscribeData = bundle.subscribe_data;
        data.bundleEvent = bundle.event;
        data.bundleZap = bundle.zap;

        bundle.request.data = z.JSON.stringify(data);
        bundle.request.method = 'DELETE';
        return bundle.request;
      },

      movie_post_poll_method_dehydration: function(bundle) {
        var movies = z.JSON.parse(bundle.response.content);
        var url = '${AUTH_JSON_SERVER_URL}/movies';
        return movies.map(movie => {
          movie.user = z.dehydrate('getUser', { userId: movie.id });
          return movie;
        });
      },

      movie_post_poll_file_dehydration: function(bundle) {
        var movies = z.JSON.parse(bundle.response.content);
        var url = '${AUTH_JSON_SERVER_URL}/movies';
        return movies.map(movie => {
          // Just a JSON file, not a real trailer
          movie.trailer = z.dehydrateFile(url, {
            params: { id: movie.id }
          }, {
            name: 'movie ' + movie.id + '.json',
            length: 1234
          });
          return movie;
        });
      },

      movie_post_poll_no_id: function(bundle) {
        var movies = z.JSON.parse(bundle.response.content);
        var url = '${AUTH_JSON_SERVER_URL}/movies';
        return movies.map(movie => {
          delete movie.id;
          return movie;
        });
      },

      movie_post_poll_underscore: function(bundle) {
        var movies = z.JSON.parse(bundle.response.content);

        // _.collect is an alias of _.map in underscore, lodash doesn't have it
        return _.collect(movies, function(movie, index) {
          // lodash doesn't have _.contains, it only has _.includes
          movie.titleHas2 = _.contains(movie.title, '2');
          return movie;
        });
      },

      /*
       * Create/Action
       */

      // To be replaced with 'movie_pre_write' at runtime
      movie_pre_write_disabled: function(bundle) {
        bundle.request.url += 's';
        bundle.request.data = z.JSON.stringify(bundle.action_fields_full);
        return bundle.request;
      },

      // To be replaced with 'movie_post_write' at runtime
      movie_post_write_disabled: function(bundle) {
        var data = z.JSON.parse(bundle.response.content);
        data.year = 2017;
        return data;
      },

      // To be replaced with 'movie_pre_write' at runtime
      movie_pre_write_unflatten: function(bundle) {
        // Make sure bundle.action_fields is unflatten, bundle.action_fields_full
        // isn't, and bundle.action_fields_raw still got curlies
        bundle.request.url = 'https://zapier-httpbin.herokuapp.com/post';
        bundle.request.data = z.JSON.stringify({
          action_fields: bundle.action_fields,
          action_fields_full: bundle.action_fields_full,
          action_fields_raw: bundle.action_fields_raw,
          orig_data: z.JSON.parse(bundle.request.data)
        });
        return bundle.request;
      },

      movie_post_write_sloppy_mode: function(bundle) {
        // Would throw a ReferenceError in strict mode
        data = z.JSON.parse(bundle.response.content);

        // Octal literals are not allowed in strct mode
        data.year = 03742;  // Octal representation for 2018

        // Strict mode forbids setting props on primitive values
        (14).sailing = 'home';

        return data;
      },

      // To be replaced with 'movie_write' at runtime
      movie_write_sync: function(bundle) {
        bundle.request.url += 's';
        bundle.request.data = z.JSON.stringify(bundle.action_fields_full);
        var response = z.request(bundle.request);
        var data = z.JSON.parse(response.content);
        data.year = 2016;
        return data;
      },

      // To be replaced with 'movie_write' at runtime
      movie_write_async: function(bundle, callback) {
        bundle.request.url += 's';
        bundle.request.data = z.JSON.stringify(bundle.action_fields_full);
        z.request(bundle.request, function(err, response) {
          if (err) {
            callback(err, response);
          } else {
            var data = z.JSON.parse(response.content);
            data.year = 2015;
            callback(err, data);
          }
        });
      },

      // To be replaced with 'movie_pre_custom_action_fields' at runtime
      movie_pre_custom_action_fields_disabled: function(bundle) {
        bundle.request.url += 's';
        return bundle.request;
      },

      // To be replaced with 'movie_post_custom_action_fields' at runtime
      movie_post_custom_action_fields_disabled: function(bundle) {
        var fields = z.JSON.parse(bundle.response.content);
        fields.push({
          key: 'year',
          label: 'Year',
          type: 'int'
        });
        return fields;
      },

      // To be replaced with 'movie_custom_action_fields' at runtime
      movie_custom_action_fields_disabled: function(bundle) {
        // bundle.request.url should be an empty string to start with
        bundle.request.url += '${AUTH_JSON_SERVER_URL}/input-fields';
        var response = z.request(bundle.request);
        var fields = z.JSON.parse(response.content);
        fields.push({
          key: 'year',
          label: 'Year',
          type: 'int'
        });
        return fields;
      },

      // To be replaced with 'movie_pre_custom_action_result_fields' at runtime
      movie_pre_custom_action_result_fields_disabled: function(bundle) {
        bundle.request.url += 's';
        return bundle.request;
      },

      // To be replaced with 'movie_post_custom_action_result_fields' at runtime
      movie_post_custom_action_result_fields_disabled: function(bundle) {
        var fields = z.JSON.parse(bundle.response.content);
        fields.push({
          key: 'tagline',
          label: 'Tagline',
          type: 'unicode'
        });
        return fields;
      },

      // To be replaced with 'movie_custom_action_result_fields' at runtime
      movie_custom_action_result_fields_disabled: function(bundle, callback) {
        // bundle.request.url should be an empty string to start with
        bundle.request.url += '${AUTH_JSON_SERVER_URL}/output-fields';
        z.request(bundle.request, function(err, response) {
          if (err) {
            callback(err, response);
          } else {
            var fields = z.JSON.parse(response.content);
            fields.push({
              key: 'tagline',
              label: 'Tagline',
              type: 'unicode'
            });
            callback(err, fields);
          }
        });
      },

      // To be replaced with 'file_pre_write' at runtime
      file_pre_write_tweak_filename: function(bundle) {
        bundle.request.files.file[0] = bundle.request.files.file[0].toUpperCase();
        return bundle.request;
      },

      // To be replaced with 'file_pre_write' at runtime
      file_pre_write_replace_hydrate_url: function(bundle) {
        var file = bundle.request.files.file;
        file[0] = 'file_pre_write_was_here.' + file[0];
        file[1] = file[1].replace('/png', '/jpeg');
        file[2] = file[2].replace('png', 'jpeg');
        return bundle.request;
      },

      // To be replaced with 'file_pre_write' at runtime
      file_pre_write_replace_with_string_content: function(bundle) {
        var file = bundle.request.files.file;
        file[0] = file[0] + '.txt';
        file[1] = 'file_pre_write was here';
        file[2] = file[2].replace('image', 'text').replace('png', 'plain');
        return bundle.request;
      },

      // To be replaced with 'file_pre_write' at runtime
      file_pre_write_fully_replace_url: function(bundle) {
        bundle.request.files.file = 'https://zapier-httpbin.herokuapp.com/image/jpeg';
        return bundle.request;
      },

      // To be replaced with 'file_pre_write' at runtime
      file_pre_write_fully_replace_content: function(bundle) {
        bundle.request.files.file = 'fully replaced by file_pre_write';
        return bundle.request;
      },

      file_pre_write_content_dispoistion_with_quotes: function(bundle) {
        bundle.request.files.file =
          'https://zapier-httpbin.herokuapp.com/response-headers?' +
          'Content-Disposition=filename=%22an%20example.json%22';
        return bundle.request;
      },

      file_pre_write_content_dispoistion_no_quotes: function(bundle) {
        bundle.request.files.file =
          'https://zapier-httpbin.herokuapp.com/response-headers?' +
          'Content-Disposition=filename=example.json';
        return bundle.request;
      },

      file_pre_write_content_dispoistion_non_ascii: function(bundle) {
        bundle.request.files.file =
          'https://zapier-httpbin.herokuapp.com/response-headers?' +
          'Content-Disposition=filename*=UTF-8%27%27%25E4%25B8%25AD%25E6%2596%2587.json';
        return bundle.request;
      },

      /*
       * Search
       */

      // To be replaced with 'movie_pre_search' at runtime
      movie_pre_search_disabled: function(bundle) {
        bundle.request.url = bundle.request.url.replace('movie?', 'movies?');
        return bundle.request;
      },

      // To be replaced with 'movie_post_search' at runtime
      movie_post_search_disabled: function(bundle) {
        var results = z.JSON.parse(bundle.response.content);
        results[0].title += ' (movie_post_search was here)';
        return results;
      },

      // To be replaced with 'movie_search' at runtime
      movie_search_disabled: function(bundle) {
        bundle.request.url = bundle.request.url.replace('movie?', 'movies?');
        var response = z.request(bundle.request);
        var results = z.JSON.parse(response.content);
        results[0].title += ' (movie_search was here)';
        return results;
      },

      // To be replaced with 'movie_pre_read_resource' at runtime
      movie_pre_read_resource_disabled: function(bundle) {
        // Replace '/movie/123' with '/movies/123'
        bundle.request.url =
          bundle.request.url.replace(/\\/movie\\/\\d+/, '/movies/' + bundle.read_fields.id);
        return bundle.request;
      },

      // To be replaced with 'movie_post_read_resource' at runtime
      movie_post_read_resource_disabled: function(bundle) {
        var movie = z.JSON.parse(bundle.response.content);
        movie.title += ' (movie_post_read_resource was here)';
        movie.anotherId = bundle.read_fields.id;
        return movie;
      },

      movie_read_resource_disabled: function(bundle) {
        bundle.request.url = bundle.request.url.replace('/movie/', '/movies/');
        var response = z.request(bundle.request);
        var movie = z.JSON.parse(response.content);
        movie.title += ' (movie_read_resource was here)';
        return movie;
      },

      // To be replaced with 'movie_pre_custom_search_fields' at runtime
      movie_pre_custom_search_fields_disabled: function(bundle) {
        bundle.request.url += 's';
        return bundle.request;
      },

      // To be replaced with 'movie_post_custom_search_fields' at runtime
      movie_post_custom_search_fields_disabled: function(bundle) {
        var fields = z.JSON.parse(bundle.response.content);
        fields.push({
          key: 'year',
          label: 'Year',
          type: 'int'
        });
        return fields;
      },

      // To be replaced with 'movie_custom_search_fields' at runtime
      movie_custom_search_fields_disabled: function(bundle) {
        // bundle.request.url should be an empty string to start with
        bundle.request.url += '${AUTH_JSON_SERVER_URL}/input-fields';
        var response = z.request(bundle.request);
        var fields = z.JSON.parse(response.content);
        fields.push({
          key: 'year',
          label: 'Year',
          type: 'int'
        });
        return fields;
      },

      // To be replaced with 'movie_pre_custom_search_result_fields' at runtime
      movie_pre_custom_search_result_fields_disabled: function(bundle) {
        bundle.request.url += 's';
        return bundle.request;
      },

      // To be replaced with 'movie_post_custom_search_result_fields' at runtime
      movie_post_custom_search_result_fields_disabled: function(bundle) {
        var fields = z.JSON.parse(bundle.response.content);
        fields.push({
          key: 'tagline',
          label: 'Tagline',
          type: 'unicode'
        });
        return fields;
      },

      // To be replaced with 'movie_custom_search_result_fields' at runtime
      movie_custom_search_result_fields_disabled: function(bundle, callback) {
        // bundle.request.url should be an empty string to start with
        bundle.request.url += '${AUTH_JSON_SERVER_URL}/output-fields';
        z.request(bundle.request, function(err, response) {
          if (err) {
            callback(err, response);
          } else {
            var fields = z.JSON.parse(response.content);
            fields.push({
              key: 'tagline',
              label: 'Tagline',
              type: 'unicode'
            });
            callback(err, fields);
          }
        });
      }
    };
`;

const ContactTrigger_full = {
  key: 'contact_full',
  noun: 'Contact',
  display: {
    label: 'New Contact with Full Scripting'
  },
  operation: {
    perform: {
      source: "return z.legacyScripting.run(bundle, 'trigger', 'contact_full');"
    },
    outputFields: [
      {
        key: 'id',
        label: 'ID',
        type: 'integer'
      },
      {
        key: 'name',
        label: 'Name',
        type: 'string'
      },
      {
        source:
          "return z.legacyScripting.run(bundle, 'trigger.output', 'contact_full');"
      }
    ]
  }
};

const ContactTrigger_pre = {
  key: 'contact_pre',
  noun: 'Contact',
  display: {
    label: 'New Contact with Pre Scripting'
  },
  operation: {
    perform: {
      source: "return z.legacyScripting.run(bundle, 'trigger', 'contact_pre');"
    }
  }
};

const ContactTrigger_post = {
  key: 'contact_post',
  noun: 'Contact',
  display: {
    label: 'New Contact with Post Scripting'
  },
  operation: {
    perform: {
      source: "return z.legacyScripting.run(bundle, 'trigger', 'contact_post');"
    }
  }
};

const ContactTrigger_pre_post = {
  key: 'contact_pre_post',
  noun: 'Contact',
  display: {
    label: 'New Contact with Pre & Post Scripting'
  },
  operation: {
    perform: {
      source:
        "return z.legacyScripting.run(bundle, 'trigger', 'contact_pre_post');"
    }
  }
};

const ContactHook_scriptingless = {
  key: 'contact_hook_scriptingless',
  noun: 'Contact',
  display: {
    label: 'Contact Hook without Scripting'
  },
  operation: {
    perform: {
      source:
        "return z.legacyScripting.run(bundle, 'trigger.hook', 'contact_hook_scriptingless');"
    }
  }
};

const ContactHook_scripting = {
  key: 'contact_hook_scripting',
  noun: 'Contact',
  display: {
    label: 'Contact Hook with KEY_catch_hook Scripting'
  },
  operation: {
    perform: {
      source:
        "return z.legacyScripting.run(bundle, 'trigger.hook', 'contact_hook_scripting');"
    },
    performSubscribe: {
      source:
        "return z.legacyScripting.run(bundle, 'trigger.hook.subscribe', 'contact_hook_scripting');"
    },
    performUnsubscribe: {
      source:
        "return z.legacyScripting.run(bundle, 'trigger.hook.unsubscribe', 'contact_hook_scripting');"
    }
  }
};

const TestTrigger = {
  key: 'test',
  display: {
    label: 'Test Auth'
  },
  operation: {
    perform: {
      source: "return z.legacyScripting.run(bundle, 'trigger', 'test');"
    }
  }
};

const MovieTrigger = {
  key: 'movie',
  display: {
    label: 'New Movie'
  },
  operation: {
    perform: {
      source: "return z.legacyScripting.run(bundle, 'trigger', 'movie');"
    }
  }
};

const MovieCreate = {
  key: 'movie',
  noun: 'Movie',
  display: {
    label: 'Create a Movie'
  },
  operation: {
    perform: {
      source: "return z.legacyScripting.run(bundle, 'create', 'movie');"
    },
    inputFields: [
      { key: 'title', label: 'Title', type: 'string' },
      { key: 'genre', label: 'Genre', type: 'string' },
      {
        source: "return z.legacyScripting.run(bundle, 'create.input', 'movie');"
      }
    ],
    outputFields: [
      { key: 'id', label: 'ID', type: 'integer' },
      { key: 'title', label: 'Title', type: 'string' },
      { key: 'genre', label: 'Genre', type: 'string' },
      {
        source:
          "return z.legacyScripting.run(bundle, 'create.output', 'movie');"
      }
    ]
  }
};

const FileUpload = {
  key: 'file',
  noun: 'File',
  display: {
    label: 'Upload a File'
  },
  operation: {
    perform: {
      source: "return z.legacyScripting.run(bundle, 'create', 'file');"
    },
    inputFields: [
      { key: 'filename', label: 'Filename', type: 'string' },
      { key: 'file', label: 'File', type: 'file' }
    ],
    outputFields: [{ key: 'id', label: 'ID', type: 'integer' }]
  }
};

const MovieSearch = {
  key: 'movie',
  noun: 'Movie',
  display: {
    label: 'Find a Movie'
  },
  operation: {
    perform: {
      source: "return z.legacyScripting.run(bundle, 'search', 'movie');"
    },
    performGet: {
      source:
        "return z.legacyScripting.run(bundle, 'search.resource', 'movie');"
    },
    inputFields: [
      { key: 'query', label: 'Query', type: 'string' },
      {
        source: "return z.legacyScripting.run(bundle, 'search.input', 'movie');"
      }
    ],
    outputFields: [
      { key: 'id', label: 'ID', type: 'integer' },
      { key: 'title', label: 'Title', type: 'string' },
      { key: 'genre', label: 'Genre', type: 'string' },
      {
        source:
          "return z.legacyScripting.run(bundle, 'search.output', 'movie');"
      }
    ]
  }
};

const App = {
  title: 'Example App',
  triggers: {
    [ContactTrigger_full.key]: ContactTrigger_full,
    [ContactTrigger_pre.key]: ContactTrigger_pre,
    [ContactTrigger_post.key]: ContactTrigger_post,
    [ContactTrigger_pre_post.key]: ContactTrigger_pre_post,
    [ContactHook_scriptingless.key]: ContactHook_scriptingless,
    [ContactHook_scripting.key]: ContactHook_scripting,
    [TestTrigger.key]: TestTrigger,
    [MovieTrigger.key]: MovieTrigger
  },
  creates: {
    [MovieCreate.key]: MovieCreate,
    [FileUpload.key]: FileUpload
  },
  searches: {
    [MovieSearch.key]: MovieSearch
  },
  hydrators: {
    legacyMethodHydrator: {
      source: "return z.legacyScripting.run(bundle, 'hydrate.method');"
    },
    legacyFileHydrator: {
      source: "return z.legacyScripting.run(bundle, 'hydrate.file');"
    }
  },
  legacy: {
    scriptingSource: legacyScriptingSource,

    subscribeUrl: 'http://zapier-httpbin.herokuapp.com/post',
    unsubscribeUrl: 'https://zapier-httpbin.herokuapp.com/delete',

    authentication: {
      oauth2Config: {
        // Incomplete URLs on purpose to test pre_oauthv2_token
        accessTokenUrl: `${AUTH_JSON_SERVER_URL}/oauth/access-`,
        refreshTokenUrl: `${AUTH_JSON_SERVER_URL}/oauth/refresh-`
      }
    },

    triggers: {
      contact_full: {
        operation: {
          // The URL misses an 's' at the end of the resource names. That is,
          // 'output-field' where it should be 'output-fields'. Done purposely for
          // scripting to fix it.
          outputFieldsUrl: `${AUTH_JSON_SERVER_URL}/output-field`
        }
      },
      contact_post: {
        operation: {
          url: `${AUTH_JSON_SERVER_URL}/users`
        }
      },
      contact_hook_scripting: {
        operation: {
          event: 'contact.created',
          hookType: 'rest'
        }
      },
      test: {
        operation: {
          url: `${AUTH_JSON_SERVER_URL}/me`
        }
      },
      movie: {
        operation: {
          url: `${AUTH_JSON_SERVER_URL}/movies`
        }
      }
    },

    creates: {
      movie: {
        operation: {
          // These URLs miss an 's' at the end of the resource names. That is,
          // 'movie' where it should be 'movies' and 'input-field' where it should
          // be 'input-fields'. Done purposely for scripting to fix it.
          url: `${AUTH_JSON_SERVER_URL}/movie`,
          inputFieldsUrl: `${AUTH_JSON_SERVER_URL}/input-field`,
          outputFieldsUrl: `${AUTH_JSON_SERVER_URL}/output-field`,
          fieldsExcludedFromBody: ['title']
        }
      },
      file: {
        operation: {
          url: `${AUTH_JSON_SERVER_URL}/upload`
        }
      }
    },

    searches: {
      movie: {
        operation: {
          // These URLs miss an 's' at the end of the resource names. That is,
          // 'movie' where it should be 'movies' and 'input-field' where it should
          // be 'input-fields'. Done purposely for scripting to fix it.
          url: `${AUTH_JSON_SERVER_URL}/movie?q={{bundle.inputData.query}}`,
          resourceUrl: `${AUTH_JSON_SERVER_URL}/movie/{{bundle.inputData.id}}`,
          inputFieldsUrl: `${AUTH_JSON_SERVER_URL}/input-field`,
          outputFieldsUrl: `${AUTH_JSON_SERVER_URL}/output-field`
        }
      }
    }
  }
};

module.exports = App;
