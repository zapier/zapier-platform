/* globals describe, it */
require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('basic auth app', () => {
  it('automatically has Authorize Header add', done => {
    // Try changing the values of username or password to see how the test method behaves
    const bundle = {
      authData: {
        username: 'user',
        password: 'secret'
      }
    };

    appTester(App.authentication.test, bundle)
      .then(response => {
        response.status.should.eql(200);
        response.request.headers.Authorization.should.eql(
          'Basic dXNlcjpzZWNyZXQ='
        );
        done();
      })
      .catch(done);
  });

  it('fails on bad auth', () => {
    // Try changing the values of username or password to see how the test method behaves
    const bundle = {
      authData: {
        username: 'user',
        password: 'badpwd'
      }
    };

    return appTester(App.authentication.test, bundle).should.be.rejected();
  });
});
