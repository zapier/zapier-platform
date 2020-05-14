/* globals describe, it */

require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('digest auth app', () => {
  it('automatically has Authorize Header add', () => {
    // Try changing the values of username or password to see how the test method behaves
    const bundle = {
      authData: {
        username: 'myuser',
        password: 'mypass',
      },
    };

    return appTester(App.authentication.test, bundle).then((response) => {
      response.status.should.eql(200);
      response.data.authenticated.should.be.true();
      response.data.user.should.eql('myuser');
    });
  });

  it('fails on bad auth', () => {
    // Try changing the values of username or password to see how the test method behaves
    const bundle = {
      authData: {
        username: 'myuser',
        password: 'badpwd',
      },
    };

    return appTester(App.authentication.test, bundle).should.be.rejected();
  });
});
