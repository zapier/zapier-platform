require('should');
const convert = require('../../utils/convert');
const definitions = {
  basic: require('./definitions/basic.json'),
  apiHeader: require('./definitions/api-header.json'),
  apiQuery: require('./definitions/api-query.json'),
  session: require('./definitions/session.json'),
  oauth2: require('./definitions/oauth2.json'),
  oauth2Refresh: require('./definitions/oauth2-refresh.json'),
};

/* eslint no-eval: 0 */
const s2js = (string) => eval(`
const AuthTest = { operation: { perform: 'FAKE_PERFORM_FUNCTION' } };
const getSessionKey = 'FAKE_GET_SESSION_KEY_FUNCTION';
(${string});
`);

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
    it('should render basic auth', (done) => {
      const wbDef = definitions.basic;

      convert.renderAuth(wbDef)
        .then(string => {
          const auth = s2js(string);
          auth.should.eql({
            type: 'basic',
            test: 'FAKE_PERFORM_FUNCTION',
            fields: [
              {
                key: 'username',
                type: 'string',
                required: true,
                label: 'Username'
              },
              {
                key: 'password',
                type: 'password',
                required: true,
                label: 'Password'
              }
            ],
            connectionLabel: '{{username}}'
          });
          done();
        })
        .catch(done);
    });

    it('should render API Key (Header) auth', (done) => {
      const wbDef = definitions.apiHeader;

      convert.renderAuth(wbDef)
        .then(string => {
          const auth = s2js(string);
          auth.should.eql({
            type: 'custom',
            test: 'FAKE_PERFORM_FUNCTION',
            fields: [
              {
                key: 'api_key',
                type: 'string',
                required: true,
                label: 'API Key'
              }
            ],
            connectionLabel: '{{user}}'
          });
          done();
        })
        .catch(done);
    });

    it('should render API Key (Header) beforeRequest', (done) => {
      const wbDef = definitions.apiHeader;

      convert.getHeader(wbDef)
        .then(string => {
          string.should.eql(`const maybeIncludeAuth = (request, z, bundle) => {

  request.headers['Authorization'] = bundle.authData['api_key'];

  return request;
}

`);
          done();
        })
        .catch(done);
    });

    it('should render API Key (Query) auth', (done) => {
      const wbDef = definitions.apiQuery;

      convert.renderAuth(wbDef)
        .then(string => {
          const auth = s2js(string);
          auth.should.eql({
            type: 'custom',
            test: 'FAKE_PERFORM_FUNCTION',
            fields: [
              {
                key: 'api_key',
                type: 'string',
                required: true,
                label: 'API Key'
              }
            ],
            connectionLabel: '{{user}}'
          });
          done();
        })
        .catch(done);
    });

    it('should render API Key (Query) beforeRequest', (done) => {
      const wbDef = definitions.apiQuery;

      convert.getHeader(wbDef)
        .then(string => {
          string.should.eql(`const maybeIncludeAuth = (request, z, bundle) => {

  request.params['api_key'] = bundle.authData['api_key'];

  return request;
}

`);
          done();
        })
        .catch(done);
    });

    it('should render Session auth', (done) => {
      const wbDef = definitions.session;

      convert.renderAuth(wbDef)
        .then(string => {
          const auth = s2js(string);
          auth.should.eql({
            type: 'session',
            test: 'FAKE_PERFORM_FUNCTION',
            fields: [
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
            ],
            sessionConfig: {
              perform: 'FAKE_GET_SESSION_KEY_FUNCTION'
            },
            connectionLabel: '{{user}}'
          });
          done();
        })
        .catch(done);
    });

    it('should render Session beforeRequest and afterResponse', (done) => {
      const wbDef = definitions.session;

      convert.getHeader(wbDef)
        .then(string => {
          string.should.eql(`const maybeIncludeAuth = (request, z, bundle) => {

  request.headers['X-Token'] = bundle.authData.sessionKey;

  return request;
}

const maybeRefresh = (response, z, bundle) => {
  if (response.status === 401 || response.status === 403) {
    throw new z.errors.RefreshAuthError('Session key needs refreshing.');
  }

  return response;
}


const getSessionKey = (z, bundle) => {
  const scripting = require('../scripting');
  const legacyScriptingRunner = require('zapier-platform-legacy-scripting-runner')(scripting);

  // Do a get_session_info() from scripting.
  const getSessionEvent = {
    name: 'auth.session'
  };
  return legacyScriptingRunner.runEvent(getSessionEvent, z, bundle)
    .then((getSessionResult) => {
      // IMPORTANT NOTE:
      //   WB apps in scripting's get_session_info() allowed to return any object and that would be
      //   added to the authData, but CLI apps require you to specifically define those.
      //   That means that if you return more than one key from your scripting's get_session_info(),
      //   you might need to manually tweak this method to return that value at the end of this method,
      //   and also add more fields to the authentication definition.

      const resultKeys = Object.keys(getSessionResult);
      const firstKeyValue = (getSessionResult && resultKeys.length > 0) ? getSessionResult[resultKeys[0]] : getSessionResult;

      return {
        sessionKey: firstKeyValue
      };
    });
}

`);
          done();
        })
        .catch(done);
    });

    it('should render oauth2', (done) => {
      const wbDef = definitions.oauth2;

      convert.renderAuth(wbDef)
        .then(string => {
          const auth = s2js(string);

          auth.should.eql({
            type: 'oauth2',
            test: 'FAKE_PERFORM_FUNCTION',
            oauth2Config: {
              authorizeUrl: {
                method: 'GET',
                url: 'https://wt-c396b46e7e285c63f4bd6d4f8d32dc2e-0.run.webtask.io/oauth2-authorize',
                params: {
                  client_id: '{{process.env.CLIENT_ID}}',
                  state: '{{bundle.inputData.state}}',
                  redirect_uri: '{{bundle.inputData.redirect_uri}}',
                  response_type: 'code'
                }
              },
              getAccessToken: {
                method: 'POST',
                url: 'https://wt-c396b46e7e285c63f4bd6d4f8d32dc2e-0.run.webtask.io/oauth2-access-token',
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
            },
            connectionLabel: '{{user}}'
          });
          done();
        })
        .catch(done);
    });

    it('should render oauth2 beforeRequest', (done) => {
      const wbDef = definitions.oauth2;

      convert.getHeader(wbDef)
        .then(string => {
          string.should.eql(`const maybeIncludeAuth = (request, z, bundle) => {

  request.headers.Authorization = \`Bearer \${bundle.authData.access_token}\`;

  return request;
}

`);
          done();
        })
        .catch(done);
    });

    it('should render oauth2-refresh', (done) => {
      const wbDef = definitions.oauth2Refresh;

      convert.renderAuth(wbDef)
        .then(string => {
          const auth = s2js(string);

          auth.should.eql({
            type: 'oauth2',
            test: 'FAKE_PERFORM_FUNCTION',
            oauth2Config: {
              authorizeUrl: {
                method: 'GET',
                url: 'https://wt-c396b46e7e285c63f4bd6d4f8d32dc2e-0.run.webtask.io/oauth2-authorize',
                params: {
                  client_id: '{{process.env.CLIENT_ID}}',
                  state: '{{bundle.inputData.state}}',
                  redirect_uri: '{{bundle.inputData.redirect_uri}}',
                  response_type: 'code'
                }
              },
              getAccessToken: {
                method: 'POST',
                url: 'https://wt-c396b46e7e285c63f4bd6d4f8d32dc2e-0.run.webtask.io/oauth2-access-token',
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
                url: 'https://wt-c396b46e7e285c63f4bd6d4f8d32dc2e-0.run.webtask.io/oauth2-refresh-token',
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
            },
            connectionLabel: '{{user}}'
          });
          done();
        })
        .catch(done);
    });

    it('should render oauth2-refresh beforeRequest', (done) => {
      const wbDef = definitions.oauth2Refresh;

      convert.getHeader(wbDef)
        .then(string => {
          string.should.eql(`const maybeIncludeAuth = (request, z, bundle) => {

  request.headers.Authorization = \`Bearer \${bundle.authData.access_token}\`;

  return request;
}

`);
          done();
        })
        .catch(done);
    });

  });

  describe('render step', () => {
    it('should fill with trigger default description', () => {
      const v2Def = {
        key: 'exampleStep',
        noun: 'Example',
        label: 'Example Step',
      };

      return convert.renderStep('trigger', v2Def).then(content => {
        content.should.containEql("description: 'Triggers on a new example.'");
      });
    });

    it('should fill with create default description', () => {
      const v2Def = {
        key: 'exampleStep',
        noun: 'Example',
        label: 'Example Step',
      };

      return convert.renderStep('create', v2Def).then(content => {
        content.should.containEql("description: 'Creates a example.'");
      });
    });

    it('should fill with search default description', () => {
      const v2Def = {
        key: 'exampleStep',
        noun: 'Example',
        label: 'Example Step',
      };

      return convert.renderStep('search', v2Def).then(content => {
        content.should.containEql("description: 'Finds a example.'");
      });
    });
  });

  describe('render sample', () => {
    it('should render sample output fields', () => {
      const wbDef = {
        sample_result_fields: [
          { type: 'float', key: 'bounds__northeast__lat' },
          { type: 'float', key: 'bounds__northeast__lng' },
          { type: 'float', key: 'bounds__southwest__lat' },
          { type: 'float', key: 'bounds__southwest__lng' },
          { type: 'unicode', key: 'copyrights', label: 'Copyright' },
          { type: 'unicode', key: 'legs[]duration__text', important: true, label: 'Legs Duration' },
        ]
      };

      const string = '{' + convert.renderSample(wbDef) + '}';
      const fields = s2js(string);
      fields.should.eql({
        outputFields: [
          { type: 'number', key: 'bounds__northeast__lat' },
          { type: 'number', key: 'bounds__northeast__lng' },
          { type: 'number', key: 'bounds__southwest__lat' },
          { type: 'number', key: 'bounds__southwest__lng' },
          { type: 'string', key: 'copyrights', label: 'Copyright' },
          { type: 'string', key: 'legs[]duration__text', label: 'Legs Duration' },
        ]
      });
    });
  });

});
