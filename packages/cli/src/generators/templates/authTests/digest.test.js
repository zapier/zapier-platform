/* globals describe, it, expect */

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('digest auth', function () {
  this.timeout(1000 * 30); // 30 secs timeout
  this.retries(3); // retry up to 3 times

  it('correctly authenticates', async () => {
    // Try changing the values of username or password to see how the test method behaves
    const bundle = {
      authData: {
        username: 'myuser',
        password: 'mypass',
      },
    };

    const response = await appTester(App.authentication.test, bundle);

    expect(response.status).toBe(200);
    expect(response.data.authorized).toBe(true);
    expect(response.data.user).toBe('myuser');
  });

  it('fails on bad auth', async () => {
    // Try changing the values of username or password to see how the test method behaves
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
