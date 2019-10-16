/* globals describe, it */
require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('digest auth', () => {
  it('correctly authenticates', async () => {
    // Try changing the values of username or password to see how the test method behaves
    const bundle = {
      authData: {
        username: 'user',
        password: 'secret'
      }
    };

    const response = await appTester(App.authentication.test, bundle);

    response.status.should.eql(200);
    response.json.authenticated.should.be.true();
    response.json.user.should.eql('myuser');
  });

  it('fails on bad auth', async () => {
    // Try changing the values of username or password to see how the test method behaves
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
