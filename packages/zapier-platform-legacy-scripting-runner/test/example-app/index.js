const legacyScriptingSource = `
    var Zap = {
      get_session_info: function(bundle) {
        var encodedCredentials = btoa(bundle.auth_fields.username + ':' + bundle.auth_fields.password);
        var response = z.request({
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': 'Basic ' + encodedCredentials
          },
          url: 'https://auth-json-server.zapier.ninja/me'
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

      pre_oauthv2_refresh: function(bundle) {
        bundle.request.url += 'token';
        return bundle.request;
      },

      get_connection_label: function(bundle) {
        return 'Hi ' + bundle.test_result.name;
      },

      contact_full_poll: function(bundle) {
        bundle.request.url = 'https://auth-json-server.zapier.ninja/users';
        var response = z.request(bundle.request);
        var contacts = z.JSON.parse(response.content);
        contacts[0].name = 'Patched by KEY_poll!';
        return contacts;
      },

      contact_pre_pre_poll: function(bundle) {
        bundle.request.url = 'https://auth-json-server.zapier.ninja/users';
        bundle.request.params.id = 3;
        return bundle.request;
      },

      contact_post_post_poll: function(bundle) {
        var contacts = z.JSON.parse(bundle.response.content);
        contacts[0].name = 'Patched by KEY_post_poll!';
        return contacts;
      },

      contact_pre_post_pre_poll: function(bundle) {
        bundle.request.url = 'https://auth-json-server.zapier.ninja/users';
        bundle.request.params.id = 4;
        return bundle.request;
      },

      contact_pre_post_post_poll: function(bundle) {
        var contacts = z.JSON.parse(bundle.response.content);
        contacts[0].name = 'Patched by KEY_pre_poll & KEY_post_poll!';
        return contacts;
      },

      // To be replaced to 'contact_hook_scripting_catch_hook' on runtime
      contact_hook_scripting_catch_hook_returning_object: function(bundle) {
        var result = bundle.cleaned_request;
        result.luckyNumber = 777;
        return result;
      },

      // To be replaced to 'contact_hook_scripting_catch_hook' on runtime
      contact_hook_scripting_catch_hook_returning_array: function(bundle) {
        var results = bundle.cleaned_request;
        for (const contact of results) {
          contact.luckyNumber = contact.id * 10;
        }
        return results;
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
    }
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
    legacyProperties: {
      url: 'https://auth-json-server.zapier.ninja/users'
    },
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
    }
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
    [ContactHook_scripting.key]: ContactHook_scripting
  },
  legacyScriptingSource
};

module.exports = App;
