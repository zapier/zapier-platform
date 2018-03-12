require('should');
const requireFromString = require('require-from-string');
const convert = require('../../utils/convert');
const definitions = {
  noAuth: require('./definitions/no-auth.json'),
  basic: require('./definitions/basic.json'),
  basicScripting: require('./definitions/basic-scripting.json'),
  apiHeader: require('./definitions/api-header.json'),
  apiQuery: require('./definitions/api-query.json'),
  session: require('./definitions/session.json'),
  oauth2: require('./definitions/oauth2.json'),
  oauth2Scripting: require('./definitions/oauth2-scripting.json'),
  oauth2Refresh: require('./definitions/oauth2-refresh.json'),
  oauth2RefreshScripting: require('./definitions/oauth2-refresh-scripting.json')
};

/* eslint no-eval: 0 */
const s2js = string => eval(`(${string});`);

const loadAuthModuleFromString = string => {
  // As the test trigger module doesn't exist during unit testing, let's mock
  // the test trigger import with a dummy test trigger that returns the test
  // trigger module path, allowing us to assert on.
  let match = string.match(/const testTrigger = require\('([^']*)/);
  const testTriggerPath = match ? match[1] : 'TEST TRIGGER NOT IMPORTED';
  string = string.replace(/const testTrigger = require\(.*;/, '');
  string =
    `const testTrigger = {operation: {perform: () => '${testTriggerPath}'}};\n` +
    string;

  // utils doesn't exist during testing neither, so let's mock it, too.
  string = string.replace(/const { replaceVars } = require\(.*;/, '');

  return requireFromString(string);
};

describe('convert render functions', () => {
  describe('render field', () => {
    it('should render a string field', () => {
      const wbKey = 'test_field';
      const wbDef = {
        label: 'test field',
        type: 'Unicode',
        required: true,
        help_text: 'help text goes here'
      };

      const string = convert.renderField(wbDef, wbKey);
      const field = s2js(string);
      field.should.eql({
        key: 'test_field',
        label: 'test field',
        type: 'string',
        required: true,
        helpText: 'help text goes here'
      });
    });

    it('should keep empty help text empty', () => {
      const wbKey = 'test_field';
      const wbDef = {
        help_text: ''
      };

      const string = convert.renderField(wbDef, wbKey);
      const field = s2js(string);
      field.should.not.have.property('helpText');
    });

    it('should escape single quotes in label', () => {
      const wbKey = 'test_field';
      const wbDef = {
        label: "It's a test"
      };

      const string = convert.renderField(wbDef, wbKey);
      const field = s2js(string);
      field.label.should.eql("It's a test");
    });

    it('should escape multi-line help text', () => {
      const wbKey = 'test_field';
      const wbDef = {
        help_text: 'line 1\nline 2\nline 3\n'
      };

      const string = convert.renderField(wbDef, wbKey);
      const field = s2js(string);
      field.helpText.should.eql('line 1\nline 2\nline 3\n');
    });

    it('should escape single quotes in help text', () => {
      const wbKey = 'test_field';
      const wbDef = {
        help_text: "That's ok"
      };

      const string = convert.renderField(wbDef, wbKey);
      const field = s2js(string);
      field.helpText.should.eql("That's ok");
    });

    it('should convert a static dropdown', () => {
      const wbKey = 'genre';
      const wbDef = {
        key: 'genre',
        label: 'Genre',
        type: 'Unicode',
        required: true,
        choices: 'drama,scifi|Sci-Fi,super-hero|Super Hero,thriller'
      };

      const string = convert.renderField(wbDef, wbKey);
      const field = s2js(string);
      field.choices.should.eql({
        drama: 'Drama',
        scifi: 'Sci-Fi',
        'super-hero': 'Super Hero',
        thriller: 'Thriller'
      });
    });

    it('should convert a dynamic dropdown', () => {
      const wbKey = 'test';
      const wbDef = {
        key: 'test_field',
        label: 'test field',
        type: 'Unicode',
        required: true,
        prefill: 'test.id.name'
      };

      const string = convert.renderField(wbDef, wbKey);
      const field = s2js(string);
      field.dynamic.should.eql('test.id.name');
    });

    it('should convert a search-powered field', () => {
      const wbKey = 'test';
      const wbDef = {
        key: 'test_field',
        label: 'test field',
        type: 'Unicode',
        required: true,
        searchfill: 'test.id'
      };

      const string = convert.renderField(wbDef, wbKey);
      const field = s2js(string);
      field.search.should.eql('test.id');
    });
  });

  describe('authentication', () => {
    it('should not render no auth', () => {
      const wbDef = definitions.noAuth;
      return convert.renderIndex(wbDef).then(string => {
        string.should.not.containEql('authentication:');
        convert.hasAuth(wbDef).should.be.false();
      });
    });

    it('should render basic auth', () => {
      const wbDef = definitions.basic;

      return convert.renderAuth(wbDef).then(string => {
        const auth = loadAuthModuleFromString(string);
        auth.type.should.eql('custom');
        auth.fields.should.eql([
          {
            key: 'username',
            label: 'Username',
            required: true,
            type: 'string'
          },
          {
            key: 'password',
            label: 'Password',
            required: true,
            type: 'password'
          }
        ]);
        auth.connectionLabel.should.eql('{{username}}');
        auth.test().should.eql('./triggers/test_auth');
      });
    });

    it('should render basic auth w/scripting', () => {
      const wbDef = definitions.basicScripting;

      return convert.renderAuth(wbDef).then(string => {
        const auth = loadAuthModuleFromString(string);
        auth.type.should.eql('custom');
        auth.fields.should.eql([
          {
            key: 'username',
            label: 'Username',
            required: true,
            type: 'string'
          },
          {
            key: 'password',
            label: 'Password',
            required: true,
            type: 'password'
          }
        ]);
        auth.connectionLabel.should.be.Function();
        auth.test().should.eql('./triggers/test_auth');
      });
    });

    it('should render API Key (Headers) auth', () => {
      const wbDef = definitions.apiHeader;

      return convert.renderAuth(wbDef).then(string => {
        const auth = loadAuthModuleFromString(string);
        auth.type.should.eql('custom');
        auth.fields.should.eql([
          {
            key: 'api_key',
            type: 'string',
            required: true,
            label: 'API Key'
          }
        ]);
        auth.connectionLabel.should.eql('{{user}}');
        auth.test().should.eql('./triggers/test_auth');
      });
    });

    it('should render API Key (Headers) beforeRequest', () => {
      const wbDef = definitions.apiHeader;

      return convert.getHeader(wbDef).then(string => {
        string.should.eql(
          'const maybeIncludeAuth = (request, z, bundle) => {\n' +
            "  request.headers['Authorization'] = `AccessKey ${bundle.authData['api_key']}`;\n" +
            '\n' +
            '  return request;\n' +
            '};\n'
        );
      });
    });

    it('should render API Key (Query) auth', () => {
      const wbDef = definitions.apiQuery;

      return convert.renderAuth(wbDef).then(string => {
        const auth = loadAuthModuleFromString(string);
        auth.type.should.eql('custom');
        auth.fields.should.eql([
          {
            key: 'api_key',
            type: 'string',
            required: true,
            label: 'API Key'
          }
        ]);
        auth.connectionLabel.should.eql('{{user}}');
        auth.test().should.eql('./triggers/test_auth');
      });
    });

    it('should render API Key (Query) beforeRequest', () => {
      const wbDef = definitions.apiQuery;

      return convert.getHeader(wbDef).then(string => {
        string.should.eql(
          'const maybeIncludeAuth = (request, z, bundle) => {\n' +
            "  request.params['api_key'] = `${bundle.authData['api_key']}`;\n" +
            '\n' +
            '  return request;\n' +
            '};\n'
        );
      });
    });

    it('should render Session auth', () => {
      const wbDef = definitions.session;

      return convert.renderAuth(wbDef).then(string => {
        const auth = loadAuthModuleFromString(string);
        auth.type.should.eql('session');
        auth.fields.should.eql([
          {
            key: 'email',
            type: 'string',
            required: true,
            label: 'Email'
          },
          {
            key: 'pass',
            type: 'password',
            required: true,
            label: 'Password'
          }
        ]);
        auth.connectionLabel.should.eql('{{user}}');
        auth.test().should.eql('./triggers/test_auth');
        auth.sessionConfig.perform.should.be.Function();
      });
    });

    it('should render Session beforeRequest and afterResponse', () => {
      const wbDef = definitions.session;

      return convert.getHeader(wbDef).then(string => {
        string.should.eql(`const maybeIncludeAuth = (request, z, bundle) => {
  request.headers['X-Token'] = bundle.authData.sessionKey;

  return request;
};

const maybeRefresh = (response, z, bundle) => {
  if (response.status === 401 || response.status === 403) {
    throw new z.errors.RefreshAuthError('Session key needs refreshing.');
  }

  return response;
};

const getSessionKey = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  // Do a get_session_info() from scripting.
  const getSessionEvent = {
    name: 'auth.session'
  };
  return legacyScriptingRunner.runEvent(getSessionEvent, z, bundle).then(getSessionResult => {
    // IMPORTANT NOTE:
    //   WB apps in scripting's get_session_info() allowed you to return any object and that would
    //   be added to the authData, but CLI apps require you to specifically define those.
    //   That means that if you return more than one key from your scripting's get_session_info(),
    //   you might need to manually tweak this method to return that value at the end of this method,
    //   and also add more fields to the authentication definition.

    const resultKeys = Object.keys(getSessionResult);
    const firstKeyValue =
      getSessionResult && resultKeys.length > 0 ? getSessionResult[resultKeys[0]] : getSessionResult;

    return {
      sessionKey: firstKeyValue
    };
  });
};
`);
      });
    });

    it('should render oauth2', () => {
      const wbDef = definitions.oauth2;

      return convert.renderAuth(wbDef).then(string => {
        const auth = loadAuthModuleFromString(string);

        auth.type.should.eql('oauth2');
        auth.oauth2Config.should.eql({
          authorizeUrl: {
            method: 'GET',
            url:
              'https://wt-c396b46e7e285c63f4bd6d4f8d32dc2e-0.run.webtask.io/oauth2-authorize',
            params: {
              client_id: '{{process.env.CLIENT_ID}}',
              state: '{{bundle.inputData.state}}',
              redirect_uri: '{{bundle.inputData.redirect_uri}}',
              response_type: 'code'
            }
          },
          getAccessToken: {
            method: 'POST',
            url:
              'https://wt-c396b46e7e285c63f4bd6d4f8d32dc2e-0.run.webtask.io/oauth2-access-token',
            body: {
              code: '{{bundle.inputData.code}}',
              client_id: '{{process.env.CLIENT_ID}}',
              client_secret: '{{process.env.CLIENT_SECRET}}',
              redirect_uri: '{{bundle.inputData.redirect_uri}}',
              grant_type: 'authorization_code'
            },
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          },
          scope: ''
        });
        auth.connectionLabel.should.eql('{{user}}');
        auth.test().should.eql('./triggers/test_auth');
      });
    });

    it('should render oauth2 beforeRequest', () => {
      const wbDef = definitions.oauth2;

      return convert.getHeader(wbDef).then(string => {
        string.should.eql(`const maybeIncludeAuth = (request, z, bundle) => {
  if (bundle.authData.access_token) {
    request.headers.Authorization = \`Bearer \${bundle.authData.access_token}\`;
  }
  return request;
};
`);
      });
    });

    it('should render oauth2 w/scripting', () => {
      const wbDef = definitions.oauth2Scripting;

      return convert.renderAuth(wbDef).then(string => {
        const auth = loadAuthModuleFromString(string);

        auth.type.should.eql('oauth2');
        auth.oauth2Config.authorizeUrl.should.eql({
          method: 'GET',
          url:
            'https://wt-c396b46e7e285c63f4bd6d4f8d32dc2e-0.run.webtask.io/oauth2-authorize',
          params: {
            client_id: '{{process.env.CLIENT_ID}}',
            state: '{{bundle.inputData.state}}',
            redirect_uri: '{{bundle.inputData.redirect_uri}}',
            response_type: 'code'
          }
        });
        auth.oauth2Config.scope.should.eql('');
        auth.oauth2Config.getAccessToken.should.be.Function();
        auth.connectionLabel.should.eql('{{user}}');
        auth.test().should.eql('./triggers/test_auth');
      });
    });

    it('should render oauth2-refresh', () => {
      const wbDef = definitions.oauth2Refresh;

      return convert.renderAuth(wbDef).then(string => {
        const auth = loadAuthModuleFromString(string);

        auth.type.should.eql('oauth2');
        auth.oauth2Config.should.eql({
          authorizeUrl: {
            method: 'GET',
            url:
              'https://wt-c396b46e7e285c63f4bd6d4f8d32dc2e-0.run.webtask.io/oauth2-authorize',
            params: {
              client_id: '{{process.env.CLIENT_ID}}',
              state: '{{bundle.inputData.state}}',
              redirect_uri: '{{bundle.inputData.redirect_uri}}',
              response_type: 'code'
            }
          },
          getAccessToken: {
            method: 'POST',
            url:
              'https://wt-c396b46e7e285c63f4bd6d4f8d32dc2e-0.run.webtask.io/oauth2-access-token',
            body: {
              code: '{{bundle.inputData.code}}',
              client_id: '{{process.env.CLIENT_ID}}',
              client_secret: '{{process.env.CLIENT_SECRET}}',
              redirect_uri: '{{bundle.inputData.redirect_uri}}',
              grant_type: 'authorization_code'
            },
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          },
          refreshAccessToken: {
            method: 'POST',
            url:
              'https://wt-c396b46e7e285c63f4bd6d4f8d32dc2e-0.run.webtask.io/oauth2-refresh-token',
            body: {
              refresh_token: '{{bundle.authData.refresh_token}}',
              client_id: '{{process.env.CLIENT_ID}}',
              client_secret: '{{process.env.CLIENT_SECRET}}',
              grant_type: 'refresh_token'
            },
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          },
          scope: '',
          autoRefresh: true
        });
        auth.connectionLabel.should.eql('{{user}}');
        auth.test().should.eql('./triggers/test_auth');
      });
    });

    it('should render oauth2-refresh w/scripting', () => {
      const wbDef = definitions.oauth2RefreshScripting;

      return convert.renderAuth(wbDef).then(string => {
        const auth = loadAuthModuleFromString(string);

        auth.type.should.eql('oauth2');
        auth.oauth2Config.authorizeUrl.should.eql({
          method: 'GET',
          url:
            'https://wt-c396b46e7e285c63f4bd6d4f8d32dc2e-0.run.webtask.io/oauth2-authorize',
          params: {
            client_id: '{{process.env.CLIENT_ID}}',
            state: '{{bundle.inputData.state}}',
            redirect_uri: '{{bundle.inputData.redirect_uri}}',
            response_type: 'code'
          }
        });
        auth.oauth2Config.scope.should.eql('');
        auth.oauth2Config.autoRefresh.should.be.true();
        auth.oauth2Config.getAccessToken.should.be.Function();
        auth.oauth2Config.refreshAccessToken.should.be.Function();
        auth.connectionLabel.should.eql('{{user}}');
        auth.test().should.eql('./triggers/test_auth');
      });
    });

    it('should render oauth2-refresh beforeRequest', () => {
      const wbDef = definitions.oauth2Refresh;

      return convert.getHeader(wbDef).then(string => {
        string.should.eql(`const maybeIncludeAuth = (request, z, bundle) => {
  if (bundle.authData.access_token) {
    request.headers.Authorization = \`Bearer \${bundle.authData.access_token}\`;
  }
  return request;
};
`);
      });
    });
  });

  describe('render step', () => {
    it('should fill with trigger default description', () => {
      const wbDef = {
        triggers: {
          exampleStep: {
            noun: 'Example',
            label: 'Example Step'
          }
        }
      };
      const stepDef = wbDef.triggers.exampleStep;

      return convert
        .renderStep('trigger', stepDef, 'exampleStep', wbDef)
        .then(content => {
          content.should.containEql(
            "description: 'Triggers on a new example.'"
          );
        });
    });

    it('should fill with create default description', () => {
      const wbDef = {
        actions: {
          exampleStep: {
            noun: 'Example',
            label: 'Example Step'
          }
        }
      };
      const stepDef = wbDef.actions.exampleStep;

      return convert
        .renderStep('create', stepDef, 'exampleStep', wbDef)
        .then(content => {
          content.should.containEql("description: 'Creates a example.'");
        });
    });

    it('should fill with search default description', () => {
      const wbDef = {
        searches: {
          exampleStep: {
            noun: 'Example',
            label: 'Example Step'
          }
        }
      };
      const stepDef = wbDef.searches.exampleStep;

      return convert
        .renderStep('search', stepDef, 'exampleStep', wbDef)
        .then(content => {
          content.should.containEql("description: 'Finds a example.'");
        });
    });

    it('should escape trigger label and description', () => {
      const wbDef = {
        triggers: {
          example: {
            label: "Ender's Trigger",
            help_text: "It's a trigger.\nLine 2."
          }
        }
      };
      const stepDef = wbDef.triggers.example;

      return convert
        .renderStep('trigger', stepDef, 'example', wbDef)
        .then(content => {
          content.should.containEql('label: "Ender\'s Trigger"');
          content.should.containEql(
            'description: "It\'s a trigger.\\nLine 2."'
          );
        });
    });

    it('should escape create label and description', () => {
      const wbDef = {
        actions: {
          example: {
            label: "Ender's Action",
            help_text: "It's an action.\nLine 2."
          }
        }
      };
      const stepDef = wbDef.actions.example;

      return convert
        .renderStep('create', stepDef, 'example', wbDef)
        .then(content => {
          content.should.containEql('label: "Ender\'s Action"');
          content.should.containEql(
            'description: "It\'s an action.\\nLine 2."'
          );
        });
    });

    it('should escape search label and description', () => {
      const wbDef = {
        searches: {
          example: {
            label: "Ender's Search",
            help_text: "It's a search.\nLine 2."
          }
        }
      };
      const stepDef = wbDef.searches.example;

      return convert
        .renderStep('search', stepDef, 'example', wbDef)
        .then(content => {
          content.should.containEql('label: "Ender\'s Search"');
          content.should.containEql('description: "It\'s a search.\\nLine 2."');
        });
    });
  });

  describe('render sample fields', () => {
    it('should render sample output fields', () => {
      const wbFields = [
        { type: 'float', key: 'bounds__northeast__lat' },
        { type: 'float', key: 'bounds__northeast__lng' },
        { type: 'float', key: 'bounds__southwest__lat' },
        { type: 'float', key: 'bounds__southwest__lng' },
        { type: 'unicode', key: 'copyrights', label: 'Copyright' },
        {
          type: 'unicode',
          key: 'legs[]duration__text',
          important: true,
          label: 'Legs Duration'
        }
      ];

      const string = '[' + convert.renderSampleFields(wbFields) + ']';
      const cliFields = s2js(string);
      cliFields.should.eql([
        { type: 'number', key: 'bounds__northeast__lat' },
        { type: 'number', key: 'bounds__northeast__lng' },
        { type: 'number', key: 'bounds__southwest__lat' },
        { type: 'number', key: 'bounds__southwest__lng' },
        { type: 'string', key: 'copyrights', label: 'Copyright' },
        { type: 'string', key: 'legs[]duration__text', label: 'Legs Duration' }
      ]);
    });
  });

  describe('render scripting', () => {
    it('should normalize newlines', () => {
      const wbDef = {
        js: 'var a = 1;\r\nvar b = 2;\rvar c = 3;\n'
      };
      return convert.renderScripting(wbDef).then(scripting => {
        scripting.should.containEql('var a = 1;\nvar b = 2;\nvar c = 3;\n');
      });
    });

    it("should remove 'use strict'", () => {
      const wbDef = {
        js: "'use strict';\nvar foo = 'bar';\n'"
      };
      return convert.renderScripting(wbDef).then(scripting => {
        scripting.should.not.containEql("'use strict';\nvar foo = 'bar';\n");
        scripting.should.containEql("var foo = 'bar';\n");
      });
    });
  });

  describe('render package.json', () => {
    it('should render track info', () => {
      const wbDef = {
        general: {
          title: 'Example App',
          description: 'It\'s an "example" app.',
          app_id: 1234
        }
      };
      return convert.renderPackageJson(wbDef).then(content => {
        const pkg = JSON.parse(content);
        pkg.zapier.convertedFromAppID.should.eql(1234);
        pkg.zapier.convertedByCLIVersion.should.be.ok();
      });
    });
  });
});
