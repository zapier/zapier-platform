require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('session auth app', () => {
  it('has an exchange for username/password', (done) => {
    // Try changing the values of username or password to see how the test method behaves
    const bundle = {
      authData: {
        username: 'bryan',
        password: 'hunter2'
      }
    };

    appTester(App.authentication.sessionConfig.perform, bundle)
      .then((newAuthData) => {
        newAuthData.sessionKey.should.eql('new session key!');
        done();
      })
      .catch(done);
  });

  it('has auth details added to every request', (done) => {
    // Try changing the values of username or password to see how the test method behaves
    const bundle = {
      authData: {
        sessionKey: 'my session key'
      }
    };

    appTester(App.authentication.test, bundle)
      .then((response) => {
        response.status.should.eql(200);
        response.request.headers['X-Session-Key'].should.eql('my session key');
        done();
      })
      .catch(done);
  });
});
