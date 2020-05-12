/* globals describe, it, expect */

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('basic auth', () => {
  it('automatically has Authorize Header add', async () => {
    const bundle = {
      authData: {
        username: 'user',
        password: 'secret',
      },
    };

    const response = await appTester(App.authentication.test, bundle);

    expect(response.status).toBe(200);
    expect(response.request.headers.Authorization).toBe(
      'Basic dXNlcjpzZWNyZXQ='
    );
  });

  it('fails on bad auth', async () => {
    const bundle = {
      authData: {
        username: 'user',
        password: 'badpwd',
      },
    };

    try {
      await appTester(App.authentication.test, bundle);
    } catch (err) {
      expect(err.message).toContain(
        'The username and/or password you supplied is incorrect'
      );
      return;
    }
    throw new Error('appTester should have thrown');
  });
});
