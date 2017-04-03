require('should');
const convert = require('../../utils/convert');

/* eslint no-eval: 0 */
const s2js = (string) => eval(`(${string})`);

describe('convert render functions', () => {

  describe('render field', () => {
    it('should render a string field', () => {
      const v2Key = 'test_field';
      const v2Def = {
        label: 'test field',
        type: 'Unicode',
        required: true,
        help_text: 'help text goes here'
      };

      const string = convert.renderField(v2Def, v2Key);
      const field = s2js(string);
      field.should.eql({
        key: 'test_field',
        label: 'test field',
        type: 'string',
        required: true,
        helpText: 'help text goes here'
      });
    });

    it('should pad help text that is too short', () => {
      const v2Key = 'test_field';
      const v2Def = {
        help_text: 'too short'
      };

      const string = convert.renderField(v2Def, v2Key);
      const field = s2js(string);
      field.helpText.should.eql('too short (help text must be at least 10 characters)');
    });
  });

  describe('authentication', () => {
    it('should render basic auth', (done) => {
      const v2Def = {
        general: {
          auth_type: 'Basic Auth'
        },
        auth_fields: {
          username: {
            label: 'Username',
            required: true,
            type: 'Unicode'
          },
          password: {
            label: 'Password',
            placeholder: '***',
            required: true,
            type: 'Password'
          }
        }
      };

      convert.renderAuth(v2Def).then(string => {
        const auth = s2js(string);
        auth.should.eql({
          type: 'basic',
          test: {
            url: 'http://www.example.com/auth'
          },
          fields: [
            {
              key: 'username',
              type: 'string',
              required: true,
              label: 'Username',
              helpText: '(help text must be at least 10 characters)'
            },
            {
              key: 'password',
              type: 'password',
              required: true,
              label: 'Password',
              placeholder: '***',
              helpText: '(help text must be at least 10 characters)'
            }
          ]
        });
      });
      done();
    });
  });

  it.skip('should render oauth2', (done) => {
    const v2Def = {
      general: {
        auth_type: 'OAuth V2',
        auth_urls: {
          access_token_url: 'https://example.com/api/v2/oauth2/token',
          authorization_url: 'https://example.com/api/oauth2/authorize'
        }
      }
    };

    convert.renderAuth(v2Def).then(string => {
      const auth = s2js(string);

      auth.should.eql({
        type: 'oauth2',
        test: {
          url: 'http://www.example.com/auth'
        },
        oauth2Config: {
          authorizeUrl: {
            method: 'GET',
            url: 'https://example.com/api/oauth2/authorize',
            params: {
              client_id: '{{process.env.CLIENT_ID}}',
              state: '{{bundle.inputData.state}}',
              redirect_uri: '{{bundle.inputData.redirect_uri}}',
              response_type: 'code'
            }
          },
          getAccessToken: {
            method: 'POST',
            url: 'https://example.com/api/v2/oauth2/token',
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
          }
        }
      });
      done();
    });
  });

  describe('render sample', () => {
    it('should render sample output fields', () => {
      const v2Def = {
        sample_result_fields: [
          { type: 'float', key: 'bounds__northeast__lat' },
          { type: 'float', key: 'bounds__northeast__lng' },
          { type: 'float', key: 'bounds__southwest__lat' },
          { type: 'float', key: 'bounds__southwest__lng' },
          { type: 'unicode', key: 'copyrights', label: 'Copyright' },
          { type: 'unicode', key: 'legs[]duration__text', important: true, label: 'Legs Duration' },
        ]
      };

      const string = '{' + convert.renderSample(v2Def) + '}';
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
