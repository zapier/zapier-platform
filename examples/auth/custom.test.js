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

  it('fails on bad auth', () => {
    const bundle = {
      authData: {
        apiKey: 'bad'
      }
    };

    return appTester(App.authentication.test, bundle).should.be.rejected();
  });
});
