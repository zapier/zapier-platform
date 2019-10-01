/* globals describe, it */

require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('custom auth', () => {
  it('passes authentication and returns json', async () => {
    const bundle = {
      authData: {
        apiKey: 'secret'
      }
    };

    const response = await appTester(App.authentication.test, bundle);
    response.json.should.have.property('username');
  });

  it('fails on bad auth', async () => {
    const bundle = {
      authData: {
        apiKey: 'bad'
      }
    };

    try {
      await appTester(App.authentication.test, bundle);
    } catch (error) {
      error.message.should.containEql('The API Key you supplied is invalid');
      return;
    }
    throw new Error('appTester should have thrown');
  });
});
