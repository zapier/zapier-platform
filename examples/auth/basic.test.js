/* globals describe, it */
require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('basic auth', () => {
  it('automatically has Authorize Header add', async () => {
    const bundle = {
      authData: {
        username: 'user',
        password: 'secret'
      }
    };

    const response = await appTester(App.authentication.test, bundle);

    response.status.should.eql(200);
    response.request.headers.Authorization.should.eql('Basic dXNlcjpzZWNyZXQ=');
  });

  it('fails on bad auth', async () => {
    const bundle = {
      authData: {
        username: 'user',
        password: 'badpwd'
      }
    };

    try {
      await appTester(App.authentication.test, bundle);
    } catch (err) {
      err.message.should.containEql(
        'The username and/or password you supplied is incorrect'
      );
      return;
    }
    throw new Error('appTester should have thrown');
  });
});
