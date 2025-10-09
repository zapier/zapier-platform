const { AUTH_JSON_SERVER_URL, HTTPBIN_URL } = require('../constants');

const legacyScriptingSource = `
    var qs = require('querystring');

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

      pre_oauthv2_token_basic: function(bundle) {
        bundle.request.url += 'token';
        bundle.request.data = bundle.request.params;
        return bundle.request;
      },

      post_oauthv2_token_basic: function(bundle) {
        var data = z.JSON.parse(bundle.response.content);
        data.something_custom += '!!';
        data.name = 'Jane Doe';
        return data;
      },

      pre_oauthv2_token_payload_only_in_params: function(bundle) {
        bundle.request.url += 'token';
        if (bundle.request.params.grant_type) {
          bundle.request.data = bundle.request.params;
        } else {
          throw new Error('should not reach here');
        }
        return bundle.request;
      },

      pre_oauthv2_token_yet_to_save_auth_fields: function(bundle) {
        bundle.request.url = '${HTTPBIN_URL}/post';
        bundle.request.data = bundle.auth_fields;
        return bundle.request;
      },

      pre_oauthv2_refresh_auth_json_server: function(bundle) {
        bundle.request.url += 'token';
        return bundle.request;
      },

      pre_oauthv2_refresh_httpbin_form: function(bundle) {
        bundle.request.url = '${HTTPBIN_URL}/post';
        return bundle.request;
      },

      pre_oauthv2_refresh_httpbin_json: function(bundle) {
        bundle.request.url = '${HTTPBIN_URL}/post';
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
          url: '${HTTPBIN_URL}/post',
          method: bundle.request.method,
          headers: bundle.request.headers,
          data: bundle.request.data
        };
      },

      pre_oauthv2_refresh_does_not_retry: function(bundle) {
        if (bundle.request.data.client_id) {
          bundle.request.url = '${HTTPBIN_URL}/post';
          return bundle.request;
        }
        throw new Error('should not reach here');
      },

      pre_oauthv2_refresh_bundle_load: function(bundle) {
        bundle.request.url = '${HTTPBIN_URL}/post';
        bundle.request.data = qs.stringify(bundle.load);
        bundle.request.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        return bundle.request;
      },

      post_oauthv2_token_returns_nothing: function(bundle) {
        // do nothing
      },

      get_connection_label: function(bundle) {
        return 'Hi ' + bundle.test_result.name;
      },

      /*
       * Polling Trigger
       */

      contact_full_poll: function(bundle) {
        bundle.request.url = '${AUTH_JSON_SERVER_URL}/users';
        bundle.request.params = { id: '2' };
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
        contacts[0].randomJson = $.parseJSON('{"hey":1}');

        contacts[0].inArray = $.inArray('a', ['a', 'b', 'b', 'a'], 2);
        contacts[0].isArray = $.isArray(contacts);
        contacts[0].isEmptyObject = $.isEmptyObject(contacts);
        contacts[0].isFunction = $.isFunction(function() {});
        contacts[0].isNumeric = $.isNumeric(123);
        contacts[0].isPlainObject = $.isPlainObject(contacts);
        contacts[0].trimmed = $.trim(' hello world  ');
        contacts[0].type = $.type(contacts);
        contacts[0].extend = $.extend({}, { extended: true });

        var base = 1000;
        $.each(contacts, function(index, item) {
          // 'item' and 'this' should be the same object
          this.anotherId = base;
          item.anotherId += index;
        });

        return contacts;
      },

      contact_post_post_poll_jquery_dom: function(bundle) {
        // Common jQuery DOM manipulation
        var xml = $.parseXML(
          '<?xml version="1.0">' +
          '<contacts>' +
          '<contact><id>123</id><name>Alice</name></contact>' +
          '<contact><id>456</id><name>Bob</name></contact>' +
          '</contacts>'
        );
        return _.map($(xml).find('contact'), function(contact) {
          var $contact = $(contact);
          return {
            id: parseInt($contact.find('id').text()),
            name: $contact.find('name').text()
          };
        });
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

      movie_pre_poll_default_headers: function(bundle) {
        // Copy Accept and Content-Type to params so we know they're already
        // available in pre_poll
        bundle.request.url = '${HTTPBIN_URL}/get';
        bundle.request.params.accept = bundle.request.headers.Accept;
        bundle.request.params.contentType = bundle.request.headers['Content-Type'];
        return bundle.request;
      },

      movie_pre_poll_dynamic_dropdown: function(bundle) {
        bundle.request.method = 'POST';
        bundle.request.url = '${HTTPBIN_URL}/post';

        // bundle.trigger_fields should be the values of the input fields of the
        // action/search/trigger that pulls the dynamic dropdown. Send it to
        // httpbin via request.data so we can check the response later.
        bundle.request.data = z.JSON.stringify(bundle.trigger_fields);
        return bundle.request;
      },

      movie_pre_poll_null_request_data: function(bundle) {
        bundle.request.url = '${HTTPBIN_URL}/get';
        bundle.request.params.requestDataIsNull =
          bundle.request.data === null ? 'yes' : 'no';
        return bundle.request;
      },

      movie_pre_poll_bundle_meta: function(bundle) {
        bundle.request.method = 'POST';
        bundle.request.url = '${HTTPBIN_URL}/post';
        bundle.request.data = z.JSON.stringify(bundle.meta);
        return bundle.request;
      },

      movie_pre_poll_request_options: function(bundle) {
        bundle.request.method = 'POST';
        bundle.request.url = '${HTTPBIN_URL}/post';
        bundle.request.headers.foo = '1234';
        bundle.request.params.bar = '5678';
        bundle.request.data = '{"aa":"bb"}';
        return bundle.request;
      },

      movie_pre_poll_invalid_chars_in_headers: function(bundle) {
        bundle.request.headers['x-api-key'] = ' \\t\\n\\r H\\t E \\nY \\r\\n\\t ';
        bundle.request.url = '${HTTPBIN_URL}/get';
        return bundle.request;
      },

      movie_pre_poll_number_header: function(bundle) {
        bundle.request.headers['x-api-key'] = Math.floor( Date.now() / 1000 )
        bundle.request.url = '${HTTPBIN_URL}/get';
        return bundle.request;
      },

      movie_pre_poll_urlencode: function(bundle) {
        bundle.request.url = '${AUTH_JSON_SERVER_URL}/echo?url=' + encodeURIComponent('https://example.com');
        return bundle.request;
      },

      getMovesUrl: function() {
        return '${AUTH_JSON_SERVER_URL}/movies';
      },

      movie_pre_poll_this_binding: function(bundle) {
        // 'this' should be bound to 'Zap'
        bundle.request.url = this.getMovesUrl();
        return bundle.request;
      },

      movie_pre_poll_error: function(bundle) {
        var foo;
        foo.bar = 1;
        return bundle.request;
      },

      movie_pre_poll_GET_with_body: function(bundle) {
        // Use postman-echo because httpbin doesn't echo a GET request's body
        bundle.request.url = '${AUTH_JSON_SERVER_URL}/echo';
        bundle.request.method = 'GET';
        bundle.request.data = JSON.stringify({
          name: 'Luke Skywalker'
        });
        return bundle.request;
      },

      movie_pre_poll_GET_with_empty_body: function(bundle) {
        bundle.request.url = '${AUTH_JSON_SERVER_URL}/echo';
        return bundle.request;
      },

      movie_pre_poll_non_ascii_url: function(bundle) {
        bundle.request.url = '${AUTH_JSON_SERVER_URL}/中文';
        return bundle.request;
      },

      movie_pre_poll_env_var: function(bundle) {
        bundle.request.url = '{{process.env.SECRET_HTTPBIN_URL}}/get?a=1&a=1';
        bundle.request.params.a = [2, 2];
        return bundle.request;
      },

      movie_pre_poll_double_headers: function(bundle) {
        bundle.request.url = '${HTTPBIN_URL}/get';
        bundle.request.headers = {
          'x-api-key': 'two',
          'X-API-KEY': 'three'
        };
        return bundle.request;
      },

      movie_pre_poll_merge_query_params: function(bundle) {
        bundle.request.url = '${HTTPBIN_URL}/get?title[]=null';
        bundle.request.params['title[]'] = ['dune', 'eternals'];
        return bundle.request;
      },

      movie_pre_poll_stop_request: function(bundle) {
        throw new StopRequestException("don't do it");
      },

      movie_post_poll_request_options: function(bundle) {
        // To make sure bundle.request is still available in post_poll
        return [bundle.request];
      },

      movie_post_poll_make_array: function(bundle) {
        return [z.JSON.parse(bundle.response.content)];
      },

      movie_post_poll_z_request_auth: function(bundle) {
        var response = z.request({
          url: '${HTTPBIN_URL}/get',
          auth: {
            bearer: bundle.auth_fields.api_key
          }
        });
        var data = z.JSON.parse(response.content);
        var authHeader = data.headers.Authorization;
        return z.JSON.parse(bundle.response.content).map(function(movie) {
          movie.authHeader = authHeader;
          return movie;
        });
      },

      movie_poll_default_headers: function(bundle) {
        // Copy Accept and Content-Type to params so we know they're already
        // available in pre_poll
        bundle.request.url = '${HTTPBIN_URL}/get';
        bundle.request.params.accept = bundle.request.headers.Accept;
        bundle.request.params.contentType = bundle.request.headers['Content-Type'];

        var response = z.request(bundle.request);
        return [z.JSON.parse(response.content)];
      },

      movie_poll_stop_request: function(bundle) {
        throw new StopRequestException('stop');
      },

      movie_poll_z_request_uri: function(bundle) {
        var response = z.request({ uri: '${HTTPBIN_URL}/get', method: 'GET' });
        return [z.JSON.parse(response.content)];
      },

      recipe_pre_poll_underscore_template: function(bundle) {
        bundle.request.url = _.template(bundle.request.url)({
          urlPath: '/recipes'
        });
        return bundle.request;
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

      contact_hook_scripting_catch_hook_raw_request: function(bundle) {
        // Make sure bundle.request is kept intact
        return {
          id: 1,
          headers: bundle.request.headers,
          querystring: bundle.request.querystring,
          content: bundle.request.content
        };
      },

      contact_hook_scripting_catch_hook_stop_request: function(bundle) {
        throw new StopRequestException('stop');
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
        data.bundleTriggerData = bundle.trigger_data;

        // Old alias for bundle.target_url
        data.bundleSubscriptionUrl = bundle.subscription_url;

        bundle.request.data = z.JSON.stringify(data);
        return bundle.request;
      },

      post_subscribe: function(bundle) {
        // This will go to bundle.subscribe_data in pre_unsubscribe
        var data = z.JSON.parse(bundle.response.content);
        data.hiddenMessage = 'post_subscribe was here!';
        data.bundleTriggerData2 = bundle.trigger_data;
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

        // Old alias for bundle.target_url
        data.bundleSubscriptionUrl = bundle.subscription_url;

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

      movie_post_poll_header_case: function(bundle) {
        var movies = z.JSON.parse(bundle.response.content);
        var contentType = bundle.response.headers['CONTENT-type'];
        movies[0].contentType = contentType;
        return movies;
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
        bundle.request.url = '${HTTPBIN_URL}/post';
        bundle.request.data = z.JSON.stringify({
          action_fields: bundle.action_fields,
          action_fields_full: bundle.action_fields_full,
          action_fields_raw: bundle.action_fields_raw,
          orig_data: z.JSON.parse(bundle.request.data)
        });
        return bundle.request;
      },

      movie_pre_write_action_fields: function(bundle) {
        // Make sure bundle.action_fields is filtered, bundle.action_fields_full
        // isn't, and bundle.action_fields_raw still got curlies
        bundle.request.url = '${HTTPBIN_URL}/post';
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

      movie_post_write_require: function(bundle) {
        return qs.parse('title=Joker&year=2019');
      },

      movie_post_write_returning_nothing: function(bundle) {},

      movie_post_write_returning_string: function(bundle) {
        return 'ok';
      },

      movie_pre_write_intercept_error: function(bundle) {
        bundle.request.url = '${HTTPBIN_URL}/status/418';
        return bundle.request;
      },

      movie_post_write_intercept_error: function(bundle) {
        if (bundle.response.status_code == 418) {
          throw new ErrorException('teapot here, go find a coffee machine');
        }
        return z.JSON.parse(bundle.response.content);
      },

      movie_post_write_bad_code: function(bundle) {
        throw new TypeError("You shouldn't see this if bundle.response is an error");
      },

      movie_pre_write_default_headers: function(bundle) {
        // Copy Accept and Content-Type to request body so we know they're
        // already available in pre_write
        bundle.request.url = '${HTTPBIN_URL}/post';
        bundle.request.data = z.JSON.stringify({
          accept: bundle.request.headers.Accept,
          contentType: bundle.request.headers['Content-Type']
        });
        return bundle.request;
      },

      recipe_pre_write_underscore_template: function(bundle) {
        var url = _.template(bundle.url_raw)({
          urlPath: bundle.action_fields_full.urlPath
        });
        return {
          method: 'POST',
          url: url,
          headers: bundle.request.headers,
          data: bundle.request.data
        };
      },

      movie_pre_write_request_fallback: function(bundle) {
        // The remaining request options should fall back to bundle.request
        return {
          url: bundle.request.url + 's'
        };
      },

      movie_pre_write_no_content: function(bundle) {
        bundle.request.url = '${HTTPBIN_URL}/status/204';
        return bundle.request;
      },

      movie_pre_write_request_data_empty_string: function(bundle) {
        bundle.request.url = '${AUTH_JSON_SERVER_URL}/echo';
        bundle.request.data = '';
        return bundle.request;
      },

      movie_pre_write_prune_empty_params: function(bundle) {
        bundle.request.url = '${HTTPBIN_URL}/post?foo=&bar=';
        bundle.request.params.foo = undefined;
        bundle.request.params.bar = null;
        bundle.request.params.baz = '';
        bundle.request.params.apple = undefined;
        bundle.request.params.banana = null;
        return bundle.request;
      },

      movie_pre_write_data_is_object: function(bundle) {
        bundle.request.url = '${AUTH_JSON_SERVER_URL}/echo';
        bundle.request.data = {
          foo: 'bar',
          apple: 123,
          banana: null,
          dragonfruit: '&=',
          eggplant: [1.11, 2.22, null],
          filbert: true,
          nest: {foo: 'bar', 'hello': {world: [1.1, 2.2]}},
          empty_object: {},
          empty_array: []
        };
        return bundle.request;
      },

      movie_pre_write_stop_request: function(bundle) {
        throw new StopRequestException('stop');
      },

      movie_write_default_headers: function(bundle) {
        bundle.request.url = '${HTTPBIN_URL}/post';
        bundle.request.data = z.JSON.stringify({
          accept: bundle.request.headers.Accept,
          contentType: bundle.request.headers['Content-Type']
        });

        var response = z.request(bundle.request);
        return z.JSON.parse(response.content);
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

      movie_write_json_true: function(bundle) {
        var data = z.JSON.parse(bundle.request.data);
        data.hello = 'world';
        var response = z.request({
          method: 'POST',
          url: '${HTTPBIN_URL}/post',
          json: true,
          body: data
        });
        return response.content;
      },

      movie_write_stop_request: function(bundle) {
        throw new StopRequestException('nothing for you');
      },

      // To be replaced with 'movie_pre_custom_action_fields' at runtime
      movie_pre_custom_action_fields_disabled: function(bundle) {
        bundle.request.url += 's';
        return bundle.request;
      },

      movie_pre_custom_action_fields_empty_request_data: function(bundle) {
        if (!bundle.request.data) {
          // Should reach here
          bundle.request.url += 's';
        }
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

      movie_post_custom_action_fields_dict_field: function(bundle) {
        var fields = z.JSON.parse(bundle.response.content);
        fields.push({
          key: 'attrs',
          label: 'Attributes',
          type: 'dict',
          list: true
        });
        return fields;
      },

      movie_post_custom_action_fields_returning_nothing: function(bundle) {},

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

      // Make sure we respect WB's preset _.template settings
      recipe_pre_custom_action_fields_underscore_template: function(bundle) {
        return {
          method: 'GET',
          url: _.template(bundle.raw_url)({ urlPath: bundle.action_fields.urlPath }),
          headers: bundle.request.headers,
        };
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
        bundle.request.files.file = '${HTTPBIN_URL}/image/jpeg';
        return bundle.request;
      },

      // To be replaced with 'file_pre_write' at runtime
      file_pre_write_fully_replace_content: function(bundle) {
        bundle.request.files.file = 'fully replaced by file_pre_write';
        return bundle.request;
      },

      file_pre_write_content_dispoistion_with_quotes: function(bundle) {
        bundle.request.files.file =
          '${HTTPBIN_URL}/response-headers?' +
          'Content-Disposition=filename=%22an%20example.json%22';
        return bundle.request;
      },

      file_pre_write_content_dispoistion_no_quotes: function(bundle) {
        bundle.request.files.file =
          '${HTTPBIN_URL}/response-headers?' +
          'Content-Disposition=filename=example.json';
        return bundle.request;
      },

      file_pre_write_content_dispoistion_non_ascii: function(bundle) {
        bundle.request.files.file =
          '${HTTPBIN_URL}/response-headers?' +
          'Content-Disposition=filename*=UTF-8%27%27%25E4%25B8%25AD%25E6%2596%2587.json';
        return bundle.request;
      },

      file_pre_write_wrong_content_type: function(bundle) {
        // Files should always be sent as multipart/form-data, no matter what
        // the developer sets here
        bundle.request.headers['Content-Type'] = 'applicaiton/x-www-form-urlencoded';
        bundle.request.data = z.JSON.parse(bundle.request.data);
        return bundle.request;
      },

      file2_pre_write_rename_file_field: function(bundle) {
        bundle.request.files = {
          file: bundle.request.files.file_1
        };
        return bundle.request;
      },

      file_pre_write_optional_file_field: function(bundle) {
        if (_.isEmpty(bundle.request.files)) {
          // Reach here when the optional file field is empty
          bundle.request.headers['Content-Type'] = 'application/json';
          bundle.request.url = '${HTTPBIN_URL}/post';
          return bundle.request;
        } else {
          // Reach here when the optional file field is filled
          bundle.request.headers['Content-Type'] = 'application/x-www-form-urlencoded';
          bundle.request.data = JSON.parse(bundle.request.data);
          return bundle.request;
        }
      },

      file_pre_write_cancel_multipart: function(bundle) {
        var file = bundle.request.files.file;
        var data = z.JSON.parse(bundle.request.data);
        data.file = file;

        bundle.request.url = '${HTTPBIN_URL}/post';

        // This should make legacy-scripting-runner switch from multipart to
        // JSON body
        bundle.request.files = {};
        bundle.request.data = z.JSON.stringify(data);

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

      movie_pre_search_stop_request: function(bundle) {
        throw new StopRequestException("don't do it");
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

      movie_search_stop_request: function(bundle) {
        throw new StopRequestException('nothing for you');
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

      movie_post_read_resource_array: function(bundle) {
        // WB would take the first item if the result is an array
        return [{rating: 'PG', year: 2020}];
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

const contactTriggerFull = {
  key: 'contact_full',
  noun: 'Contact',
  display: {
    label: 'New Contact with Full Scripting',
  },
  operation: {
    perform: {
      source:
        "return z.legacyScripting.run(bundle, 'trigger', 'contact_full');",
    },
    outputFields: [
      {
        key: 'id',
        label: 'ID',
        type: 'integer',
      },
      {
        key: 'name',
        label: 'Name',
        type: 'string',
      },
      {
        source:
          "return z.legacyScripting.run(bundle, 'trigger.output', 'contact_full');",
      },
    ],
  },
};

const contactTriggerPre = {
  key: 'contact_pre',
  noun: 'Contact',
  display: {
    label: 'New Contact with Pre Scripting',
  },
  operation: {
    perform: {
      source: "return z.legacyScripting.run(bundle, 'trigger', 'contact_pre');",
    },
  },
};

const contactTriggerPost = {
  key: 'contact_post',
  noun: 'Contact',
  display: {
    label: 'New Contact with Post Scripting',
  },
  operation: {
    perform: {
      source:
        "return z.legacyScripting.run(bundle, 'trigger', 'contact_post');",
    },
  },
};

const contactTriggerPrePost = {
  key: 'contact_pre_post',
  noun: 'Contact',
  display: {
    label: 'New Contact with Pre & Post Scripting',
  },
  operation: {
    perform: {
      source:
        "return z.legacyScripting.run(bundle, 'trigger', 'contact_pre_post');",
    },
  },
};

const contactHookScriptingless = {
  key: 'contact_hook_scriptingless',
  noun: 'Contact',
  display: {
    label: 'Contact Hook without Scripting',
  },
  operation: {
    perform: {
      source:
        "return z.legacyScripting.run(bundle, 'trigger.hook', 'contact_hook_scriptingless');",
    },
  },
};

const contactHookScripting = {
  key: 'contact_hook_scripting',
  noun: 'Contact',
  display: {
    label: 'Contact Hook with KEY_catch_hook Scripting',
  },
  operation: {
    perform: {
      source:
        "return z.legacyScripting.run(bundle, 'trigger.hook', 'contact_hook_scripting');",
    },
    performSubscribe: {
      source:
        "return z.legacyScripting.run(bundle, 'trigger.hook.subscribe', 'contact_hook_scripting');",
    },
    performUnsubscribe: {
      source:
        "return z.legacyScripting.run(bundle, 'trigger.hook.unsubscribe', 'contact_hook_scripting');",
    },
  },
};

const TestTrigger = {
  key: 'test',
  display: {
    label: 'Test Auth',
  },
  operation: {
    perform: {
      source: "return z.legacyScripting.run(bundle, 'trigger', 'test');",
    },
  },
};

const MovieTrigger = {
  key: 'movie',
  display: {
    label: 'New Movie',
  },
  operation: {
    perform: {
      source: "return z.legacyScripting.run(bundle, 'trigger', 'movie');",
    },
  },
};

const RecipeTrigger = {
  key: 'recipe',
  display: {
    label: 'New Recipe',
  },
  operation: {
    perform: {
      source: "return z.legacyScripting.run(bundle, 'trigger', 'recipe');",
    },
  },
};

const MovieCreate = {
  key: 'movie',
  noun: 'Movie',
  display: {
    label: 'Create a Movie',
  },
  operation: {
    perform: {
      source: "return z.legacyScripting.run(bundle, 'create', 'movie');",
    },
    inputFields: [
      { key: 'title', label: 'Title', type: 'string' },
      { key: 'genre', label: 'Genre', type: 'string' },
      {
        source:
          "return z.legacyScripting.run(bundle, 'create.input', 'movie');",
      },
    ],
    outputFields: [
      { key: 'id', label: 'ID', type: 'integer' },
      { key: 'title', label: 'Title', type: 'string' },
      { key: 'genre', label: 'Genre', type: 'string' },
      {
        source:
          "return z.legacyScripting.run(bundle, 'create.output', 'movie');",
      },
    ],
  },
};

const FileUpload = {
  key: 'file',
  noun: 'File',
  display: {
    label: 'Upload a File',
  },
  operation: {
    perform: {
      source: "return z.legacyScripting.run(bundle, 'create', 'file');",
    },
    inputFields: [
      { key: 'filename', label: 'Filename', type: 'string' },
      { key: 'file', label: 'File', type: 'file' },
      { key: 'yes', label: 'Yes', type: 'boolean' },
    ],
    outputFields: [{ key: 'id', label: 'ID', type: 'integer' }],
  },
};

const FileUpload2 = {
  key: 'file2',
  noun: 'File',
  display: {
    label: 'Upload a File 2',
  },
  operation: {
    perform: {
      source: "return z.legacyScripting.run(bundle, 'create', 'file2');",
    },
    inputFields: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'name', label: 'Name', type: 'string' },
      { key: 'file_1', label: 'File', type: 'file' },
    ],
    outputFields: [{ key: 'id', label: 'ID', type: 'integer' }],
  },
};

const RecipeCreate = {
  key: 'recipe',
  noun: 'Recipe',
  display: {
    label: 'Create a Recipe',
  },
  operation: {
    perform: {
      source: "return z.legacyScripting.run(bundle, 'create', 'recipe');",
    },
    inputFields: [
      { key: 'name', label: 'Name', type: 'string' },
      { key: 'directions', label: 'Directions', type: 'string' },
      {
        source:
          "return z.legacyScripting.run(bundle, 'create.input', 'recipe');",
      },
    ],
    outputFields: [
      { key: 'id', label: 'ID', type: 'integer' },
      { key: 'name', label: 'Name', type: 'string' },
      { key: 'directions', label: 'directions', type: 'string' },
    ],
  },
};

const MovieSearch = {
  key: 'movie',
  noun: 'Movie',
  display: {
    label: 'Find a Movie',
  },
  operation: {
    perform: {
      source: "return z.legacyScripting.run(bundle, 'search', 'movie');",
    },
    performGet: {
      source:
        "return z.legacyScripting.run(bundle, 'search.resource', 'movie');",
    },
    inputFields: [
      { key: 'query', label: 'Query', type: 'string' },
      {
        source:
          "return z.legacyScripting.run(bundle, 'search.input', 'movie');",
      },
    ],
    outputFields: [
      { key: 'id', label: 'ID', type: 'integer' },
      { key: 'title', label: 'Title', type: 'string' },
      { key: 'genre', label: 'Genre', type: 'string' },
      {
        source:
          "return z.legacyScripting.run(bundle, 'search.output', 'movie');",
      },
    ],
  },
};

const beforeRequestSource = `
  return z.legacyScripting.beforeRequest(request, z, bundle);
`;

const afterResponseSource = `
  return z.legacyScripting.afterResponse(response, z, bundle);
`;

const App = {
  title: 'Example App',
  triggers: {
    [contactTriggerFull.key]: contactTriggerFull,
    [contactTriggerPre.key]: contactTriggerPre,
    [contactTriggerPost.key]: contactTriggerPost,
    [contactTriggerPrePost.key]: contactTriggerPrePost,
    [contactHookScriptingless.key]: contactHookScriptingless,
    [contactHookScripting.key]: contactHookScripting,
    [TestTrigger.key]: TestTrigger,
    [MovieTrigger.key]: MovieTrigger,
    [RecipeTrigger.key]: RecipeTrigger,
  },
  creates: {
    [MovieCreate.key]: MovieCreate,
    [RecipeCreate.key]: RecipeCreate,
    [FileUpload.key]: FileUpload,
    [FileUpload2.key]: FileUpload2,
  },
  searches: {
    [MovieSearch.key]: MovieSearch,
  },
  hydrators: {
    legacyMethodHydrator: {
      source: "return z.legacyScripting.run(bundle, 'hydrate.method');",
    },
    legacyFileHydrator: {
      source: "return z.legacyScripting.run(bundle, 'hydrate.file');",
    },
  },
  // This breaks `applyBeforeMiddleware` which it looks like gets the original definition without `findSourceRequireFunctions` applied?!
  beforeRequest: [
    {
      source: beforeRequestSource,
      args: ['request', 'z', 'bundle'],
    },
  ],
  afterResponse: [
    {
      source: afterResponseSource,
      args: ['response', 'z', 'bundle'],
    },
  ],
  legacy: {
    scriptingSource: legacyScriptingSource,

    subscribeUrl: `${HTTPBIN_URL}/post`,
    unsubscribeUrl: `${HTTPBIN_URL}/delete?sub_id={{subscription_id}}`,

    authentication: {
      oauth2Config: {
        authorizeUrl: `${AUTH_JSON_SERVER_URL}/oauth/authorize`,

        // Incomplete URLs on purpose to test pre_oauthv2_token
        accessTokenUrl: `${AUTH_JSON_SERVER_URL}/oauth/access-`,
        refreshTokenUrl: `${AUTH_JSON_SERVER_URL}/oauth/refresh-`,
      },
    },

    triggers: {
      contact_full: {
        operation: {
          // The URL misses an 's' at the end of the resource names. That is,
          // 'output-field' where it should be 'output-fields'. Done purposely for
          // scripting to fix it.
          outputFieldsUrl: `${AUTH_JSON_SERVER_URL}/output-field`,
        },
      },
      contact_post: {
        operation: {
          url: `${AUTH_JSON_SERVER_URL}/users`,
        },
      },
      contact_hook_scripting: {
        operation: {
          event: 'contact.created',
          hookType: 'rest',
        },
      },
      test: {
        operation: {
          url: `${AUTH_JSON_SERVER_URL}/me`,
        },
      },
      movie: {
        operation: {
          url: `${AUTH_JSON_SERVER_URL}/movies`,
        },
      },
      recipe: {
        operation: {
          url: `${AUTH_JSON_SERVER_URL}{{bundle.inputData.urlPath}}`,
          outputFieldsUrl: `${AUTH_JSON_SERVER_URL}{{bundle.inputData.urlPath}}`,
        },
      },
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
          fieldsExcludedFromBody: ['title'],
        },
      },
      recipe: {
        operation: {
          url: `${AUTH_JSON_SERVER_URL}{{bundle.inputData.urlPath}}`,
          inputFieldsUrl: `${AUTH_JSON_SERVER_URL}{{bundle.inputData.urlPath}}`,
        },
      },
      file: {
        operation: {
          url: `${AUTH_JSON_SERVER_URL}/upload`,
        },
      },
      file2: {
        operation: {
          url: `${AUTH_JSON_SERVER_URL}/upload`,
        },
      },
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
          outputFieldsUrl: `${AUTH_JSON_SERVER_URL}/output-field`,
        },
      },
    },
  },
};

module.exports = App;
